import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, AlertCircle, Award } from 'lucide-react';
import '../styles/Quiz.css';

export const QuizView = ({ batch, pool, onCompleteQuiz }) => {
  const [queue, setQueue] = useState([]);
  const [options, setOptions] = useState([]);
  const [pickedOption, setPickedOption] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [finalStreak, setFinalStreak] = useState(0);

  // Helper shuffle array
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Generate 4 multiple-choice options for a target word
  const makeOptionsForWord = (word) => {
    const defaultPool = pool && pool.length > 3 ? pool : ['boshqarmoq', 'tanish', 'erishmoq', 'jasorat', 'yigʻmoq', 'muvaffaqiyat'];
    const filtered = defaultPool.filter((u) => u !== word.uz);
    const shuffledOthers = shuffle(filtered);
    const distractors = shuffledOthers.slice(0, 3);
    return shuffle([word.uz, ...distractors]);
  };

  // Initialize quiz queue
  useEffect(() => {
    if (batch && batch.length > 0) {
      const shuffledBatch = shuffle(batch);
      setQueue(shuffledBatch);
      setOptions(makeOptionsForWord(shuffledBatch[0]));
      setPickedOption(null);
      setIsLocked(false);
      setIsDone(false);
    }
  }, [batch]);

  const currentWord = queue[0];

  const handleAnswer = (selectedUz) => {
    if (isLocked || !currentWord) return;

    setPickedOption(selectedUz);
    setIsLocked(true);
    const isCorrect = selectedUz === currentWord.uz;

    setTimeout(() => {
      let nextQueue;
      if (isCorrect) {
        nextQueue = queue.slice(1);
      } else {
        // Move incorrect word to end of queue so user reviews it again!
        nextQueue = [...queue.slice(1), currentWord];
      }

      if (nextQueue.length === 0) {
        // All words mastered!
        finishQuiz();
      } else {
        setQueue(nextQueue);
        setOptions(makeOptionsForWord(nextQueue[0]));
        setPickedOption(null);
        setIsLocked(false);
      }
    }, isCorrect ? 600 : 1500);
  };

  const finishQuiz = async () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    const newStreak = await onCompleteQuiz();
    setFinalStreak(newStreak);
    setIsDone(true);
  };

  if (isDone) {
    return (
      <div className="quiz-container" style={{ justifyContent: 'center', textAlign: 'center' }}>
        <div className="quiz-question-card" style={{ padding: '40px 24px' }}>
          <div style={{ color: 'var(--accent-gold)', marginBottom: 16 }}>
            <Award size={64} style={{ margin: '0 auto' }} />
          </div>
          <h1 style={{ fontSize: 32, marginBottom: 8 }}>Barakalla!</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 20 }}>
            Bugungi soʻzlar boʻyicha testni 100% muvaffaqiyatli yakunladingiz.
          </p>
          <div
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: 'var(--accent-gold)',
              lineHeight: 1,
              marginBottom: 4,
            }}
          >
            {finalStreak}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
            kun ketma-ket (Streak)
          </div>
          <button
            className="btn-primary"
            onClick={() => window.location.reload()}
            style={{ width: '100%' }}
          >
            <span>Bosh sahifaga qaytish</span>
          </button>
        </div>
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className="quiz-container" style={{ textAlign: 'center', paddingTop: 60 }}>
        <p>Test yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      {/* Quiz Progress & Queue counter */}
      <div className="quiz-header">
        <span className="quiz-title">Test mashgʻuloti</span>
        <span className="quiz-queue-badge">Qoldi: {queue.length} ta soʻz</span>
      </div>

      {/* Main Question Card */}
      <div className="quiz-question-card">
        <div className="question-prompt">Oʻzbekcha tarjimasini tanlang</div>
        <div className="question-word">{currentWord.en}</div>
      </div>

      {/* 4 Options Grid */}
      <div className="options-grid">
        {options.map((opt, idx) => {
          const isSelected = pickedOption === opt;
          const isCorrect = opt === currentWord.uz;
          let btnClass = 'option-button';

          if (pickedOption !== null) {
            if (isCorrect) {
              btnClass += ' good';
            } else if (isSelected) {
              btnClass += ' bad';
            }
          }

          const optionLetters = ['A', 'B', 'C', 'D'];

          return (
            <button
              key={idx}
              className={btnClass}
              onClick={() => handleAnswer(opt)}
              disabled={isLocked}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="option-letter">{optionLetters[idx]}</span>
                <span>{opt}</span>
              </div>
              {pickedOption !== null && isCorrect && <CheckCircle2 size={20} />}
              {pickedOption !== null && isSelected && !isCorrect && <AlertCircle size={20} />}
            </button>
          );
        })}
      </div>

      {pickedOption !== null && pickedOption !== currentWord.uz && (
        <div className="retry-notice">
          Notoʻgʻri javob. Ushbu soʻz roʻyxat oxiriga qayta qoʻshildi.
        </div>
      )}
    </div>
  );
};
