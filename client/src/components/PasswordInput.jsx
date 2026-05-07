import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput({
  value,
  onChange,
  placeholder = 'Password',
  required = false,
  name,
  id,
  autoComplete = 'current-password',
  style = {},
  className = '',
  disabled = false,
  ...rest
}) {
  const [show, setShow] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        name={name}
        id={id}
        autoComplete={autoComplete}
        disabled={disabled}
        className={className}
        style={{ width: '100%', paddingRight: '44px', ...style }}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
        style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          padding: '4px',
          cursor: 'pointer',
          color: '#6B7280',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
