import React, { useState, useId } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import type { Question } from '../../types';
import { LikertScale } from './LikertScale';

export interface QuestionResponse {
  questionId: string;
  value: 0 | 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export interface QuestionCardProps {
  /** The question to display */
  question: Question;
  /** Current response (if any) */
  response: QuestionResponse | undefined;
  /** Callback when the response changes */
  onChange: (response: QuestionResponse) => void;
  /** Question number for display */
  questionNumber?: number;
}

/**
 * QuestionCard displays an individual assessment question with a Likert scale
 * and an optional collapsible notes section.
 */
export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  response,
  onChange,
  questionNumber,
}) => {
  const [showNotes, setShowNotes] = useState(Boolean(response?.notes));
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipId = useId();
  const notesId = useId();

  const handleValueChange = (value: 0 | 1 | 2 | 3 | 4 | 5) => {
    onChange({
      questionId: question.id,
      value,
      notes: response?.notes,
    });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (response) {
      onChange({
        ...response,
        notes: e.target.value || undefined,
      });
    } else {
      // If no response yet but user types notes, don't create response
      // Notes can only be saved with a value
    }
  };

  const toggleNotes = () => {
    setShowNotes(!showNotes);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
      {/* Question header */}
      <div className="mb-4">
        <div className="flex items-start gap-2">
          {questionNumber && (
            <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
              {questionNumber}
            </span>
          )}
          <div className="flex-1">
            <div className="flex items-start gap-2">
              <p className="text-gray-900 font-medium leading-relaxed">
                {question.text}
              </p>
              {question.helpText && (
                <div className="relative flex-shrink-0">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                    aria-describedby={tooltipId}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onFocus={() => setShowTooltip(true)}
                    onBlur={() => setShowTooltip(false)}
                    aria-label="Show help text"
                  >
                    <HelpCircle className="w-4 h-4" aria-hidden="true" />
                  </button>
                  {showTooltip && (
                    <div
                      id={tooltipId}
                      role="tooltip"
                      className="absolute z-10 right-0 top-6 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg"
                    >
                      {question.helpText}
                      <div className="absolute -top-1 right-2 w-2 h-2 bg-gray-900 transform rotate-45" />
                    </div>
                  )}
                </div>
              )}
            </div>
            {question.category && (
              <span className="inline-block mt-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {question.category}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Likert scale */}
      <div className="mb-4">
        <LikertScale
          value={response?.value}
          onChange={handleValueChange}
          name={`question-${question.id}`}
        />
      </div>

      {/* Notes toggle and textarea */}
      <div className="border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={toggleNotes}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-1"
          aria-expanded={showNotes}
          aria-controls={notesId}
        >
          <MessageSquare className="w-4 h-4" aria-hidden="true" />
          <span>Add notes (optional)</span>
          {showNotes ? (
            <ChevronUp className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          )}
        </button>

        {showNotes && (
          <div id={notesId} className="mt-3">
            <label htmlFor={`notes-${question.id}`} className="sr-only">
              Notes for question: {question.text}
            </label>
            <textarea
              id={`notes-${question.id}`}
              value={response?.notes || ''}
              onChange={handleNotesChange}
              placeholder="Add any additional context or notes about your answer..."
              rows={3}
              disabled={!response}
              className={`
                w-full px-3 py-2
                text-sm text-gray-900 placeholder-gray-400
                border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                resize-none
                ${!response ? 'bg-gray-50 cursor-not-allowed' : ''}
              `.trim()}
              aria-describedby={!response ? `notes-help-${question.id}` : undefined}
            />
            {!response && (
              <p
                id={`notes-help-${question.id}`}
                className="mt-1 text-xs text-gray-500"
              >
                Select a rating above to enable notes
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionCard;
