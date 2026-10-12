'use client';

import { useEffect, useRef, useState } from 'react';
import DiagnosticLanding from '@/diagnostic/components/DiagnosticLanding';
import DiagnosticQuestionnaire from '@/diagnostic/components/DiagnosticQuestionnaire';
import HomeLink from '@/diagnostic/components/HomeLink';
import { trackDiagnosticEvent } from '@/diagnostic/analytics';
import { consumeImmediateSessionLaunch } from '@/diagnostic/session-client';

export default function DigitalAuditPage() {
  const [started, setStarted] = useState(false);
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    const immediateSessionId = consumeImmediateSessionLaunch();
    if (immediateSessionId) {
      trackDiagnosticEvent({ name: 'diagnostic_start', sessionId: immediateSessionId });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStarted(true);
      return;
    }
    trackDiagnosticEvent({ name: 'landing_view' });
  }, []);

  return (
    <>
      <HomeLink />
      {started ? (
        <DiagnosticQuestionnaire />
      ) : (
        <DiagnosticLanding
          onStart={() => {
            trackDiagnosticEvent({ name: 'diagnostic_start' });
            setStarted(true);
          }}
        />
      )}
    </>
  );
}
