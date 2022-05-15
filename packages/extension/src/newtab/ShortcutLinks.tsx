import 'content-scripts-register-polyfill';
import React, {
  FormEvent,
  ReactElement,
  useContext,
  useEffect,
  useState,
} from 'react';
import PlusIcon from '@dailydotdev/shared/icons/plus.svg';
import SettingsContext from '@dailydotdev/shared/src/contexts/SettingsContext';
import { Button } from '@dailydotdev/shared/src/components/buttons/Button';
import { browser } from 'webextension-polyfill-ts';
import CustomLinksModal from './ShortcutLinksModal';
import MostVisitedSitesModal from './MostVisitedSitesModal';
import { CustomLinks } from './CustomLinks';
import useShortcutLinks from './useShortcutLinks';

export default function ShortcutLinks(): ReactElement {
  const { showTopSites } = useContext(SettingsContext);
  const [showModal, setShowModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [contentScriptsPermission, setContentScriptsPermission] =
    useState(false);
  const {
    askTopSitesPermission,
    revokePermission,
    onIsManual,
    resetSelected,
    shortcutLinks,
    formLinks = [],
    hasTopSites,
    hasCheckedPermission,
    isManual,
    formRef,
    onSaveChanges,
  } = useShortcutLinks();

  if (!showTopSites) {
    return <></>;
  }

  const onShowTopSites = () => {
    if (hasTopSites === null) {
      setShowModal(true);
    }

    onIsManual(false);
  };

  useEffect(() => {
    const permissionCall = async () => {
      const permissions = await browser.permissions.contains({
        origins: ['*://*/*'],
      });
      if (permissions) {
        setContentScriptsPermission(true);
      }
    };
    permissionCall();
  }, [browser.permissions]);

  const registerContentScripts = async () => {
    const granted = await browser.permissions.request({
      origins: ['*://*/*'],
    });
    if (granted) {
      setContentScriptsPermission(true);
      await browser.contentScripts.register({
        matches: ['<all_urls>'],
        css: [{ file: 'css/daily-companion-app.css' }],
        js: [
          { file: 'js/content.bundle.js' },
          { file: 'js/companion.bundle.js' },
        ],
      });
    }

    return granted;
  };

  const onSubmit = async (e: FormEvent) => {
    const { errors } = await onSaveChanges(e);

    if (errors) {
      return;
    }

    setShowOptions(false);
  };

  return (
    <>
      {!contentScriptsPermission && (
        <Button onClick={registerContentScripts} className="ml-2 btn-primary">
          Add companion
        </Button>
      )}
      {shortcutLinks?.length ? (
        <CustomLinks
          links={shortcutLinks}
          onOptions={() => setShowOptions(true)}
        />
      ) : (
        <Button
          className="btn-tertiary"
          rightIcon={<PlusIcon />}
          onClick={() => setShowOptions(true)}
        >
          Add shortcuts
        </Button>
      )}
      {showModal && (
        <MostVisitedSitesModal
          isOpen={showModal}
          onRequestClose={() => {
            setShowModal(false);
            onIsManual(true);
          }}
          onApprove={async () => {
            setShowModal(false);
            const granted = await askTopSitesPermission();
            if (!granted) {
              onIsManual(true);
            }
          }}
        />
      )}
      {showOptions && hasCheckedPermission && (
        <CustomLinksModal
          onSubmit={onSubmit}
          formRef={formRef}
          isOpen={showOptions}
          isManual={isManual}
          links={formLinks}
          onRevokePermission={revokePermission}
          onShowPermission={() => setShowModal(true)}
          onRequestClose={() => {
            setShowOptions(false);
            resetSelected();
          }}
          onShowCustomLinks={() => onIsManual(true)}
          onShowTopSitesClick={onShowTopSites}
        />
      )}
    </>
  );
}
