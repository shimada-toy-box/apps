import React, { HTMLAttributes, ReactElement } from 'react';
import { CardSpace, CardTextContainer } from './Card';
import { ElementPlaceholder } from '../utilities';
import classed from '../../lib/classed';
import classNames from 'classnames';

const Text = classed(ElementPlaceholder, 'h-3 rounded-xl my-2');

export type PlaceholderCardProps = {
  showImage?: boolean;
} & HTMLAttributes<HTMLDivElement>;

export function PlaceholderCard({
  className,
  showImage,
  ...props
}: PlaceholderCardProps): ReactElement {
  return (
    <article
      aria-busy
      className={classNames(
        className,
        'flex flex-col rounded-2xl p-2 bg-theme-post-disabled',
      )}
      {...props}
    >
      <CardTextContainer>
        <ElementPlaceholder className="w-6 h-6 rounded-full my-2" />
        <Text style={{ width: '100%' }} />
        <Text style={{ width: '100%' }} />
        <Text style={{ width: '80%' }} />
      </CardTextContainer>
      <CardSpace className={showImage ? 'my-2' : 'my-6'} />
      {showImage && <ElementPlaceholder className="rounded-xl h-40 my-2" />}
      <CardTextContainer>
        <Text style={{ width: '32%' }} />
      </CardTextContainer>
    </article>
  );
}
