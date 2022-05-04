import React, { ReactElement, useContext } from 'react';
import classNames from 'classnames';
import { ModalProps } from '../StyledModal';
import { ResponsiveModal } from '../ResponsiveModal';
import UserIcon from '../../../../icons/user.svg';
import { Button } from '../../buttons/Button';
import FeedFiltersIntroModalTags from './FeedFiltersIntroModalTags';
import { FeedFiltersIntroModalTagsContainer } from '../../utilities';
import { Features, getFeatureValue } from '../../../lib/featureManagement';
import FeaturesContext from '../../../contexts/FeaturesContext';

const tagsRows = [
  ['', 'docker', '', 'kubernetes', ''],
  ['', '', 'architecture', '', ''],
  ['', '', '', 'devops', ''],
  ['', 'cloud', '', '', ''],
];

const footerClass = {
  introTest1: 'justify-center',
  introTest2: 'justify-between',
};

type FeedFiltersProps = {
  actionToOpenFeedFilters: () => unknown;
  feedFilterModalType: string;
};

type ModalFooterProps = {
  feedFilterOnboardingModalType: string;
  onOpenFeedFilterModal: (event: React.MouseEvent<Element, MouseEvent>) => void;
} & Pick<ModalProps, 'onRequestClose'>;

type FeedFiltersIntroModalProps = FeedFiltersProps &
  ModalFooterProps &
  ModalProps;

const IntroModalFooter = ({
  feedFilterOnboardingModalType,
  onRequestClose,
  onOpenFeedFilterModal,
}: ModalFooterProps) => {
  return (
    <footer
      className={classNames(
        footerClass[feedFilterOnboardingModalType],
        'flex fixed responsiveModalBreakpoint:sticky bottom-0 py-3 border-t border-theme-divider-tertiary bg-theme-bg-tertiary',
      )}
    >
      {feedFilterOnboardingModalType === 'introTest2' && (
        <Button
          className="ml-4 w-20 text-theme-label-tertiary"
          onClick={onRequestClose}
        >
          Skip
        </Button>
      )}

      <Button
        className="mr-4 w-40 btn-primary-cabbage"
        onClick={onOpenFeedFilterModal}
      >
        {feedFilterOnboardingModalType === 'introTest1'
          ? 'Create my feed'
          : 'Continue'}
      </Button>
    </footer>
  );
};

export default function FeedFiltersIntroModal({
  className,
  onRequestClose,
  feedFilterOnboardingModalType,
  actionToOpenFeedFilters,
  feedFilterModalType,
  onOpenFeedFilterModal,
  ...modalProps
}: FeedFiltersIntroModalProps): ReactElement {
  const { flags } = useContext(FeaturesContext);
  const introExplainerCopy = getFeatureValue(
    Features.MyFeedExplainerCopy,
    flags,
  );

  return (
    <ResponsiveModal {...modalProps}>
      <section className="flex overflow-hidden flex-col items-center p-6 mobileL:px-10 mt-24">
        <UserIcon className="w-16 h-16" />
        <h3 className="mt-4 font-bold typo-large-title">Create my feed</h3>
        <p className="mt-3 mb-16 text-center typo-title3 text-theme-label-tertiary">
          {introExplainerCopy}
        </p>
        <FeedFiltersIntroModalTagsContainer>
          {/* eslint-disable react/no-array-index-key */}
          {tagsRows.map((row, i) => (
            <ul className="flex gap-3 mb-3" key={i}>
              {row.map((tag, j) => (
                <FeedFiltersIntroModalTags
                  key={`${i}_${j}`}
                  tag={tag}
                  shouldBeCut={j === 0 || j === row.length - 1}
                />
              ))}
            </ul>
          ))}
          {/* eslint-disable react/no-array-index-key */}
        </FeedFiltersIntroModalTagsContainer>
      </section>
      <IntroModalFooter
        feedFilterOnboardingModalType={feedFilterOnboardingModalType}
        onRequestClose={onRequestClose}
        onOpenFeedFilterModal={onOpenFeedFilterModal}
      />
    </ResponsiveModal>
  );
}