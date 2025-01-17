import classNames from 'classnames';
import React, { ReactElement, ReactNode, useContext } from 'react';
import { ModalPropsContext } from './types';

export type ModalFooterProps = {
  children?: ReactNode;
  className?: string;
  justify?: 'end' | 'center' | 'between';
  tab?: string;
};

export function ModalFooter({
  children,
  className,
  justify = 'end',
  tab,
}: ModalFooterProps): ReactElement {
  const { activeTab } = useContext(ModalPropsContext);
  if (tab && tab !== activeTab) return null;
  return (
    <footer
      className={classNames(
        'flex gap-3 items-center py-4 px-2 w-full h-14 border-t border-theme-divider-tertiary',
        `justify-${justify}`,
        className,
      )}
    >
      {children}
    </footer>
  );
}
