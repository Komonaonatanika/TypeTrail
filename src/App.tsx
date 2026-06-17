import { useCallback, useEffect, useMemo, useState } from 'react';

const TARGET_TEXT = 'The forest was silent except for the distant sound of water flowing somewhere beyond the trees.';
type SpeedState = 'low' | 'medium' | 'high';
type DemoMode = SpeedState | 'real';

interface MetricsData {
  wpm: number;
  accuracy: number;
  elapsedSeconds: number;
}

interface TypingTextProps {
  targetText: string;
  typedCharacters: string[];
  isComplete: boolean;
  hasStarted: boolean;
}

interface MetricsProps {
  metrics: MetricsData;
}

interface ForestSceneProps {
  speedState: SpeedState;
}

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const restSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${restSeconds}`;
};

const getSpeedState = (wpm: number): SpeedState => {
  if (wpm > 90) return 'high';
  if (wpm > 40) return 'medium';
  return 'low';
};

function Metrics({ metrics }: MetricsProps) {
  return (
    <aside className="metrics" aria-label="Typing metrics">
      <div className="metric">
        <strong>{metrics.wpm} WPM</strong>
        <span>Скорость</span>
      </div>
      <div className="metric">
        <strong>{metrics.accuracy}%</strong>
        <span>Точность</span>
      </div>
      <div className="metric">
        <strong>{formatTime(metrics.elapsedSeconds)}</strong>
        <span>Время</span>
      </div>
    </aside>
  );
}

function TypingText({ targetText, typedCharacters, isComplete, hasStarted }: TypingTextProps) {
  return (
    <section className="typing-area" aria-label="Typing exercise">
      <p className="typing-text">
        {targetText.split('').map((character, index) => {
          const typedCharacter = typedCharacters[index];
          const isCurrent = index === typedCharacters.length && !isComplete;
          const className = typedCharacter === undefined
            ? isCurrent
              ? 'char char--current'
              : 'char char--pending'
            : typedCharacter === character
              ? 'char char--correct'
              : 'char char--error';

          return (
            <span className={className} key={`${character}-${index}`}>
              {character === ' ' ? '\u00A0' : character}
            </span>
          );
        })}
      </p>
      {!hasStarted && <span className="typing-hint">Начните печатать</span>}
      {isComplete && <span className="typing-complete">Готово. Нажмите Enter, чтобы начать заново.</span>}
    </section>
  );
}

function ForestScene({ speedState }: ForestSceneProps) {
  const labelByState: Record<SpeedState, string> = {
    low: 'Низкий темп',
    medium: 'Средний темп',
    high: 'Высокий темп',
  };

  return (
    <section className={`forest-scene scene--${speedState}`} aria-label="Animated night forest typing pace scene">
      <div className="moon" />
      <div className="stars stars--one" />
      <div className="stars stars--two" />
      <div className="hills hills--far" />
      <div className="hills hills--near" />
      <div className="tree-line tree-line--back" />
      <div className="tree-line tree-line--front" />
      <div className="particles particles--fireflies" />
      <div className="particles particles--leaves" />
      <div className="trail">
        <div className="grass grass--one" />
        <div className="grass grass--two" />
      </div>
      <div className="walker" aria-hidden="true">
        <div className="walker__shadow" />
        <div className="walker__backpack" />
        <div className="walker__head" />
        <div className="walker__cap" />
        <div className="walker__body" />
        <div className="walker__arm walker__arm--front" />
        <div className="walker__arm walker__arm--back" />
        <div className="walker__leg walker__leg--front" />
        <div className="walker__leg walker__leg--back" />
      </div>
      <div className="pace-label">{labelByState[speedState]}</div>
    </section>
  );
}

export default function App() {
  const [typedCharacters, setTypedCharacters] = useState<string[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [demoMode, setDemoMode] = useState<DemoMode>('real');

  const isComplete = typedCharacters.length >= TARGET_TEXT.length;
  const resetSession = useCallback(() => {
    setTypedCharacters([]);
    setStartedAt(null);
    setFinishedAt(null);
    setNow(Date.now());
    setDemoMode('real');
  }, []);

  useEffect(() => {
    if (startedAt === null || finishedAt !== null) return undefined;
    const intervalId = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(intervalId);
  }, [finishedAt, startedAt]);

  const metrics = useMemo<MetricsData>(() => {
    const endTime = finishedAt ?? now;
    const elapsedSeconds = startedAt === null ? 0 : Math.max(0, (endTime - startedAt) / 1000);
    const minutesElapsed = Math.max(elapsedSeconds / 60, 1 / 60);
    const correctCharacters = typedCharacters.reduce(
      (count, character, index) => count + (character === TARGET_TEXT[index] ? 1 : 0),
      0,
    );
    const typedCount = typedCharacters.length;

    return {
      wpm: startedAt === null ? 0 : Math.round((correctCharacters / 5) / minutesElapsed),
      accuracy: typedCount === 0 ? 100 : Math.round((correctCharacters / typedCount) * 100),
      elapsedSeconds,
    };
  }, [finishedAt, now, startedAt, typedCharacters]);

  const speedState = demoMode === 'real' ? getSpeedState(metrics.wpm) : demoMode;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey) {
        const demoByKey: Record<string, DemoMode> = { '1': 'low', '2': 'medium', '3': 'high', '0': 'real' };
        const nextDemoMode = demoByKey[event.key];
        if (nextDemoMode) {
          event.preventDefault();
          setDemoMode(nextDemoMode);
        }
        return;
      }

      if (event.key === 'Enter' && isComplete) {
        event.preventDefault();
        resetSession();
        return;
      }

      if (event.key === 'Backspace') {
        event.preventDefault();
        if (!isComplete) {
          setTypedCharacters((characters) => characters.slice(0, -1));
        }
        return;
      }

      if (isComplete || event.key.length !== 1 || event.metaKey || event.ctrlKey) return;

      event.preventDefault();
      const typedAt = Date.now();
      setStartedAt((current) => current ?? typedAt);
      setNow(typedAt);
      setTypedCharacters((characters) => {
        if (characters.length >= TARGET_TEXT.length) return characters;
        const nextCharacters = [...characters, event.key];
        if (nextCharacters.length === TARGET_TEXT.length) {
          setFinishedAt(typedAt);
        }
        return nextCharacters;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isComplete, resetSession]);

  return (
    <main className="app-shell">
      <div className="noise-layer" />
      <header className="header">
        <span>TypeTrail</span>
        <Metrics metrics={metrics} />
      </header>
      <TypingText
        targetText={TARGET_TEXT}
        typedCharacters={typedCharacters}
        isComplete={isComplete}
        hasStarted={startedAt !== null}
      />
      <ForestScene speedState={speedState} />
    </main>
  );
}
