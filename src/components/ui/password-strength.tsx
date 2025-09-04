'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
  showFeedback?: boolean;
  className?: string;
}

interface StrengthLevel {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

const strengthLevels: StrengthLevel[] = [
  {
    label: 'Very Weak',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: <XCircle className="h-4 w-4 text-red-600" />
  },
  {
    label: 'Weak',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: <AlertCircle className="h-4 w-4 text-orange-600" />
  },
  {
    label: 'Fair',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: <AlertCircle className="h-4 w-4 text-yellow-600" />
  },
  {
    label: 'Good',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: <CheckCircle className="h-4 w-4 text-blue-600" />
  },
  {
    label: 'Strong',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: <CheckCircle className="h-4 w-4 text-green-600" />
  }
];

export function PasswordStrength({ password, showFeedback = true, className = '' }: PasswordStrengthProps) {
  const [strength, setStrength] = useState({ score: 0, isValid: false, feedback: [] as string[] });

  useEffect(() => {
    if (password) {
      const result = validatePasswordStrength(password);
      setStrength(result);
    } else {
      setStrength({ score: 0, isValid: false, feedback: [] });
    }
  }, [password]);

  const getStrengthLevel = (score: number) => {
    if (score <= 0.5) return strengthLevels[0];
    if (score <= 1.5) return strengthLevels[1];
    if (score <= 2.5) return strengthLevels[2];
    if (score <= 3.5) return strengthLevels[3];
    return strengthLevels[4];
  };

  const getProgressColor = (score: number) => {
    if (score <= 0.5) return 'bg-red-500';
    if (score <= 1.5) return 'bg-orange-500';
    if (score <= 2.5) return 'bg-yellow-500';
    if (score <= 3.5) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const level = getStrengthLevel(strength.score);
  const progressPercentage = (strength.score / 4) * 100;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Password Strength</span>
          <div className="flex items-center gap-2">
            {level.icon}
            <span className={`font-medium ${level.color}`}>
              {level.label}
            </span>
          </div>
        </div>
        <Progress 
          value={progressPercentage} 
          className="h-2"
          style={{
            '--progress-background': getProgressColor(strength.score)
          } as React.CSSProperties}
        />
      </div>

      {/* Feedback */}
      {showFeedback && strength.feedback.length > 0 && (
        <div className="space-y-1">
          {strength.feedback.map((feedback, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              {strength.isValid ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500" />
              )}
              <span className="text-muted-foreground">{feedback}</span>
            </div>
          ))}
        </div>
      )}

      {/* Requirements Summary */}
      {showFeedback && (
        <div className="pt-2 border-t">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-muted-foreground">8+ characters</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-muted-foreground">Uppercase</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${/[a-z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-muted-foreground">Lowercase</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${/\d/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-muted-foreground">Number</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-muted-foreground">Special char</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Password strength validation function (moved from actions for client-side use)
function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password must be at least 8 characters long');
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one uppercase letter');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one lowercase letter');
  }

  // Number check
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one number');
  }

  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one special character');
  }

  // Additional strength checks
  if (password.length >= 12) {
    score += 0.5;
  }
  if (/(.)\1{2,}/.test(password)) {
    score -= 0.5;
    feedback.push('Avoid repeating characters');
  }
  if (/123|abc|qwe/i.test(password)) {
    score -= 0.5;
    feedback.push('Avoid common patterns');
  }

  // Cap score at 4
  score = Math.min(score, 4);

  return {
    isValid: score >= 3, // Require at least 3 out of 5 basic requirements
    score: Math.max(0, score),
    feedback: feedback.length > 0 ? feedback : ['Password meets all requirements']
  };
} 