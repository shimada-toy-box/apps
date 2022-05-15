import classNames from 'classnames';
import dynamic from 'next/dynamic';
import React, {
  CSSProperties,
  ReactElement,
  useContext,
  useEffect,
  useState,
} from 'react';
import request from 'graphql-request';
import { useInfiniteQuery, useQueryClient } from 'react-query';
import AnalyticsContext from '../../contexts/AnalyticsContext';
import AuthContext from '../../contexts/AuthContext';
import { COMMENT_UPVOTES_BY_ID_QUERY } from '../../graphql/comments';
import {
  PostData,
  PostsEngaged,
  POSTS_ENGAGED_SUBSCRIPTION,
  POST_UPVOTES_BY_ID_QUERY,
} from '../../graphql/posts';
import useSubscription from '../../hooks/useSubscription';
import { postAnalyticsEvent } from '../../lib/feed';
import PostMetadata from '../cards/PostMetadata';
import PostSummary from '../cards/PostSummary';
import { LazyImage } from '../LazyImage';
import { AuthorOnboarding } from './AuthorOnboarding';
import { NewComment } from './NewComment';
import { PostActions } from './PostActions';
import { PostComments } from './PostComments';
import { PostUpvotesCommentsCount } from './PostUpvotesCommentsCount';
import { PostWidgets } from './PostWidgets';
import { TagLinks } from '../TagLinks';
import PostToc from '../widgets/PostToc';
import { PostNavigation, PostNavigationProps } from './PostNavigation';
import { PostModalActionsProps } from './PostModalActions';
import { PostLoadingPlaceholder } from './PostLoadingPlaceholder';
import classed from '../../lib/classed';
import styles from '../utilities.module.css';
import { apiUrl } from '../../lib/config';
import { UpvotesData } from '../../graphql/common';
import { getUpvotedPopupInitialState } from '../utilities';
import {
  usePostComment,
  UsePostCommentOptionalProps,
} from '../../hooks/usePostComment';

const UpvotedPopupModal = dynamic(() => import('../modals/UpvotedPopupModal'));
const NewCommentModal = dynamic(() => import('../modals/NewCommentModal'));
const ShareNewCommentPopup = dynamic(() => import('../ShareNewCommentPopup'), {
  ssr: false,
});
const Custom404 = dynamic(() => import('../Custom404'));

export interface PostContentProps
  extends Omit<PostModalActionsProps, 'post'>,
    Partial<Pick<PostNavigationProps, 'onPreviousPost' | 'onNextPost'>>,
    UsePostCommentOptionalProps {
  postById?: PostData;
  isFallback?: boolean;
  className?: string;
  enableAuthorOnboarding?: boolean;
  isLoading?: boolean;
  isModal?: boolean;
  position?: CSSProperties['position'];
}

const DEFAULT_UPVOTES_PER_PAGE = 50;

const BodyContainer = classed(
  'div',
  'flex flex-col tablet:flex-row max-w-[100vw] pb-6 tablet:pb-0',
);

const PageBodyContainer = classed(
  BodyContainer,
  'm-auto w-full max-w-[63.75rem] laptop:border-l laptop:border-theme-divider-tertiary',
);

const PostContainer = classed(
  'main',
  'flex flex-col flex-1 px-8 tablet:pb-20 tablet:border-r tablet:border-theme-divider-tertiary',
);

export const SCROLL_OFFSET = 80;

export function PostContent({
  postById,
  className,
  isFallback,
  enableAuthorOnboarding,
  enableShowShareNewComment,
  isLoading,
  isModal,
  position,
  initializeNewComment,
  onPreviousPost,
  onNextPost,
  onClose,
}: PostContentProps): ReactElement {
  const { id } = postById?.post || {};

  if (!id && !isFallback && !isLoading) {
    return <Custom404 />;
  }

  const {
    onNewComment,
    closeNewComment,
    openNewComment,
    onCommentClick,
    onShowShareNewComment,
    parentComment,
    showShareNewComment,
  } = usePostComment(postById?.post, {
    enableShowShareNewComment,
    initializeNewComment,
  });
  const { user, showLogin } = useContext(AuthContext);
  const { trackEvent } = useContext(AnalyticsContext);
  const [authorOnboarding, setAuthorOnboarding] = useState(false);
  const [upvotedPopup, setUpvotedPopup] = useState(getUpvotedPopupInitialState);
  const queryClient = useQueryClient();
  const postQueryKey = ['post', id];

  const handleShowUpvotedPost = (upvotes: number) => {
    setUpvotedPopup({
      modal: true,
      upvotes,
      requestQuery: {
        queryKey: ['postUpvotes', id],
        query: POST_UPVOTES_BY_ID_QUERY,
        params: { id, first: DEFAULT_UPVOTES_PER_PAGE },
      },
    });
  };

  const handleShowUpvotedComment = (commentId: string, upvotes: number) => {
    setUpvotedPopup({
      modal: true,
      upvotes,
      requestQuery: {
        queryKey: ['commentUpvotes', commentId],
        query: COMMENT_UPVOTES_BY_ID_QUERY,
        params: { id: commentId, first: DEFAULT_UPVOTES_PER_PAGE },
      },
    });
  };

  useSubscription(
    () => ({
      query: POSTS_ENGAGED_SUBSCRIPTION,
      variables: {
        ids: [id],
      },
    }),
    {
      next: (data: PostsEngaged) => {
        if (data.postsEngaged.id === id) {
          queryClient.setQueryData<PostData>(postQueryKey, (oldPost) => ({
            post: {
              ...oldPost.post,
              ...data.postsEngaged,
            },
          }));
        }
      },
    },
  );

  const analyticsOrigin = isModal ? 'article page' : 'article modal';

  useEffect(() => {
    if (!postById?.post) {
      return;
    }

    trackEvent(postAnalyticsEvent(`${analyticsOrigin} view`, postById.post));
  }, [postById]);

  useEffect(() => {
    if (enableAuthorOnboarding) {
      setAuthorOnboarding(true);
    }
  }, [enableAuthorOnboarding]);

  const { requestQuery } = upvotedPopup;
  const { queryKey, query, params = {} } = requestQuery || {};
  const queryResult = useInfiniteQuery<UpvotesData>(
    queryKey,
    ({ pageParam }) =>
      request(`${apiUrl}/graphql`, query, { ...params, after: pageParam }),
    {
      enabled: upvotedPopup.modal,
      getNextPageParam: (lastPage) =>
        lastPage.upvotes.pageInfo.hasNextPage &&
        lastPage.upvotes.pageInfo.endCursor,
    },
  );

  const hasNavigation = !!onPreviousPost || !!onNextPost;
  const Wrapper = hasNavigation ? BodyContainer : PageBodyContainer;

  if (isLoading) {
    return (
      <Wrapper className={className}>
        <PostLoadingPlaceholder />
      </Wrapper>
    );
  }

  if (!postById?.post) {
    return <Custom404 />;
  }

  const onLinkClick = async () => {
    trackEvent(
      postAnalyticsEvent('click', postById.post, {
        extra: { origin: analyticsOrigin },
      }),
    );
  };

  const postLinkProps = {
    href: postById?.post.permalink,
    title: 'Go to article',
    target: '_blank',
    rel: 'noopener',
    onClick: onLinkClick,
    onMouseUp: (event: React.MouseEvent) => event.button === 1 && onLinkClick(),
  };

  const isFixed = position === 'fixed';
  const padding = isFixed ? 'py-4' : 'pt-6';

  return (
    <Wrapper className={className}>
      <PostContainer
        className={classNames(
          'relative',
          isFixed && 'pt-16',
          isFixed && !hasNavigation && 'tablet:pt-0',
        )}
      >
        <PostNavigation
          onPreviousPost={onPreviousPost}
          onNextPost={onNextPost}
          className={classNames(
            !hasNavigation && !isFixed && 'tablet:pt-0',
            !hasNavigation ? 'flex laptop:hidden' : 'flex',
            padding,
            position,
            isFixed &&
              'z-3 w-full bg-theme-bg-secondary border-b border-theme-divider-tertiary px-6 top-0 -ml-8',
            isFixed && styles.fixedPostsNavigation,
          )}
          shouldDisplayTitle={isFixed}
          post={postById.post}
          onClose={onClose}
          isModal={isModal}
        />
        <h1
          className="mt-6 font-bold break-words typo-large-title"
          data-testid="post-modal-title"
        >
          {postById.post.title}
        </h1>
        {postById.post.summary && (
          <PostSummary summary={postById.post.summary} />
        )}
        <TagLinks tags={postById.post.tags || []} />
        <PostMetadata
          createdAt={postById.post.createdAt}
          readTime={postById.post.readTime}
          className="mt-4 mb-8"
          typoClassName="typo-callout"
        />
        <a
          {...postLinkProps}
          className="block overflow-hidden mb-10 rounded-2xl cursor-pointer"
          style={{ maxWidth: '25.625rem' }}
        >
          <LazyImage
            imgSrc={postById.post.image}
            imgAlt="Post cover image"
            ratio="49%"
            eager
            fallbackSrc="https://res.cloudinary.com/daily-now/image/upload/f_auto/v1/placeholders/1"
          />
        </a>
        {postById.post?.toc?.length > 0 && (
          <PostToc
            post={postById.post}
            collapsible
            className="flex laptop:hidden mt-2 mb-4"
          />
        )}
        <PostUpvotesCommentsCount
          post={postById.post}
          onUpvotesClick={handleShowUpvotedPost}
        />
        <PostActions
          post={postById.post}
          postQueryKey={postQueryKey}
          onComment={openNewComment}
          actionsClassName="hidden laptop:flex"
          origin={analyticsOrigin}
        />
        <PostComments
          post={postById.post}
          onClick={onCommentClick}
          onClickUpvote={handleShowUpvotedComment}
        />
        {authorOnboarding && (
          <AuthorOnboarding onSignUp={!user && (() => showLogin('author'))} />
        )}
        <NewComment user={user} onNewComment={openNewComment} />
      </PostContainer>
      <PostWidgets
        post={postById.post}
        isNavigationFixed={hasNavigation && isFixed}
        className="pb-20"
        onClose={onClose}
        origin={analyticsOrigin}
      />
      {upvotedPopup.modal && (
        <UpvotedPopupModal
          queryKey={queryKey}
          queryResult={queryResult}
          isOpen={upvotedPopup.modal}
          listPlaceholderProps={{ placeholderAmount: upvotedPopup.upvotes }}
          onRequestClose={() => setUpvotedPopup(getUpvotedPopupInitialState())}
        />
      )}
      {parentComment && (
        <NewCommentModal
          isOpen={!!parentComment}
          onRequestClose={closeNewComment}
          {...parentComment}
          onComment={onNewComment}
        />
      )}
      {postById && showShareNewComment && (
        <ShareNewCommentPopup
          post={postById.post}
          onRequestClose={() => onShowShareNewComment(false)}
        />
      )}
    </Wrapper>
  );
}
