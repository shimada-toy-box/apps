import { useContext, useMemo } from 'react';
import { useQueryClient } from 'react-query';
import AnalyticsContext from '../contexts/AnalyticsContext';
import { BOOT_QUERY_KEY } from '../contexts/BootProvider';
import { AllTagCategoriesData, FeedSettings } from '../graphql/feedSettings';
import { getFeedSettingsQueryKey, getHasAnyFilter } from './useFeedSettings';
import useMutateFilters from './useMutateFilters';

interface RegisterLocalFilters {
  hasFilters: boolean;
}

interface UseMyFeed {
  registerLocalFilters: (
    settings?: FeedSettings,
  ) => Promise<RegisterLocalFilters>;
}

export function useMyFeed(): UseMyFeed {
  const client = useQueryClient();
  const { updateFeedFilters } = useMutateFilters();
  const { trackEvent } = useContext(AnalyticsContext);

  const registerLocalFilters = async (settings?: FeedSettings) => {
    const key = getFeedSettingsQueryKey();
    const feedSettings =
      settings || client.getQueryData<AllTagCategoriesData>(key)?.feedSettings;

    if (!feedSettings || !getHasAnyFilter(feedSettings)) {
      return { hasFilters: false };
    }

    trackEvent({
      event_name: 'create feed',
    });
    await updateFeedFilters(feedSettings);
    await client.invalidateQueries(BOOT_QUERY_KEY);

    return { hasFilters: true };
  };

  return useMemo(() => ({ registerLocalFilters }), [registerLocalFilters]);
}
