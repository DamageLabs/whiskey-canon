import { checkPasswordStrength, MIN_PASSWORD_LENGTH } from '../utils/passwordPolicy';

interface Props {
  password: string;
}

export function PasswordStrengthIndicator({ password }: Props) {
  if (!password) return null;

  const result = checkPasswordStrength(password);

  const strengthColors = {
    weak: '#dc3545',
    fair: '#ffc107',
    strong: '#198754',
  };

  const strengthLabels = {
    weak: 'Weak',
    fair: 'Fair',
    strong: 'Strong',
  };

  const strengthWidths = {
    weak: '33%',
    fair: '66%',
    strong: '100%',
  };

  const color = strengthColors[result.strength];

  const checks = [
    { label: `${MIN_PASSWORD_LENGTH}+ characters`, met: result.meetsLength },
    { label: 'Uppercase letter', met: result.hasUppercase },
    { label: 'Lowercase letter', met: result.hasLowercase },
    { label: 'Digit', met: result.hasDigit },
    { label: 'Special character', met: result.hasSpecial },
    { label: '3 of 4 types met', met: result.meetsComplexity },
  ];

  return (
    <div className="mt-2 mb-2">
      <div className="d-flex align-items-center gap-2 mb-1">
        <div
          style={{
            height: '6px',
            flex: 1,
            backgroundColor: 'var(--zinc-700, #3f3f46)',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: strengthWidths[result.strength],
              backgroundColor: color,
              borderRadius: '3px',
              transition: 'width 0.3s, background-color 0.3s',
            }}
          />
        </div>
        <small style={{ color, fontWeight: 600, minWidth: '50px' }}>
          {strengthLabels[result.strength]}
        </small>
      </div>
      <div style={{ fontSize: '0.8rem' }}>
        {checks.map((check) => (
          <div key={check.label} style={{ color: check.met ? '#198754' : '#6c757d' }}>
            {check.met ? '\u2713' : '\u2717'} {check.label}
          </div>
        ))}
      </div>
    </div>
  );
}
