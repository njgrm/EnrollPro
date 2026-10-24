import { useEffect, useRef } from "react";
import {
  REALTIME_INVALIDATION_EVENT,
  type RealtimeInvalidationEvent,
  type RealtimeInvalidationTopic,
} from "@/shared/hooks/useRealtimeInvalidations";

interface UseRealtimeRefreshOptions {
  topics: RealtimeInvalidationTopic[];
  schoolYearId?: number | null;
  onRefresh: () => void;
}

export function useRealtimeRefresh({
  topics,
  schoolYearId,
  onRefresh,
}: UseRealtimeRefreshOptions): void {
  const onRefreshRef = useRef(onRefresh);
  const topicsRef = useRef(topics);
  onRefreshRef.current = onRefresh;
  topicsRef.current = topics;

  useEffect(() => {
    const handleRealtimeInvalidation = (event: Event) => {
      const payload = (event as CustomEvent<RealtimeInvalidationEvent>).detail;
      if (!payload?.topics) return;
      if (payload.schoolYearId && schoolYearId && payload.schoolYearId !== schoolYearId) {
        return;
      }

      const shouldRefresh = payload.topics.some((topic) =>
        topicsRef.current.includes(topic),
      );

      if (shouldRefresh) {
        onRefreshRef.current();
      }
    };

    window.addEventListener(
      REALTIME_INVALIDATION_EVENT,
      handleRealtimeInvalidation,
    );

    return () => {
      window.removeEventListener(
        REALTIME_INVALIDATION_EVENT,
        handleRealtimeInvalidation,
      );
    };
  }, [schoolYearId]);
}
