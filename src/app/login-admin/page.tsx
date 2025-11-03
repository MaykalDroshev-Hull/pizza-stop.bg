"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, User, AlertCircle } from "lucide-react";
import styles from '../../styles/admin-login.module.css';

interface LoginForm {
  username: string;
  password: string;
}

interface LoginError {
  message: string;
  type: 'error' | 'warning';
}

const LoginPage: React.FC = (): React.JSX.Element => {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginForm>({
    username: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<LoginError | null>(null);
  const [isClient, setIsClient] = useState<boolean>(false);

  // Ensure we're on the client side before accessing localStorage
  useEffect(() => {
    setIsClient(true);
    
    // Check if user is already logged in
    if (typeof window !== 'undefined') {
      const isLoggedIn = localStorage.getItem('admin_authenticated') === 'true';
      if (isLoggedIn) {
        router.push('/administraciq');
      }
    }
  }, [router]);

  const handleInputChange = (field: keyof LoginForm, value: string): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.password.trim()) {
      setError({
        message: "Моля, въведете имейл адрес и парола",
        type: "warning"
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call secure API endpoint for authentication
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          type: 'admin'
        }),
      });

      const result = await response.json();

      // Handle rate limiting (429 Too Many Requests)
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const retryMinutes = retryAfter ? Math.ceil(parseInt(retryAfter) / 60) : 15;
        setError({
          message: `Твърде много опити за влизане. Моля, изчакайте ${retryMinutes} минути преди да опитате отново.`,
          type: "error"
        });
        return;
      }

      if (response.ok && result.success) {
        // Store authentication state
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('admin_login_time', new Date().toISOString());
        
        // Store JWT tokens for API requests
        if (result.session?.access_token) {
          localStorage.setItem('admin_access_token', result.session.access_token);
        }
        if (result.session?.refresh_token) {
          localStorage.setItem('admin_refresh_token', result.session.refresh_token);
        }
        
        // Redirect to admin panel
        router.push('/administraciq');
      } else {
        setError({
          message: result.error || "Невалиден имейл адрес или парола",
          type: "error"
        });
      }
    } catch (err) {
      setError({
        message: "Възникна грешка при влизане. Моля, опитайте отново.",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (): void => {
    setShowPassword(!showPassword);
  };

  // Don't render until we're on the client side
  if (!isClient) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinnerLarge}></div>
      </div>
    );
  }

  return (
    <div className={styles.adminLoginPage}>
      <div className={styles.backgroundPattern}></div>
      
      <div className={styles.container}>
        <div className={styles.loginCard}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.iconWrapper}>
              <Lock size={32} />
            </div>
            <h1 className={styles.title}>
              Администрация
            </h1>
            <p className={styles.subtitle}>
              Влезте в административния панел на Pizza Stop
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`${styles.errorMessage} ${error.type === 'error' ? styles.error : styles.warning}`}>
              <AlertCircle size={20} />
              <span>{error.message}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Email Field */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                Имейл адрес
              </label>
              <div className={styles.inputWrapperWithIcon}>
                <User className={styles.inputIcon} size={20} />
                <input
                  type="email"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className={styles.input}
                  placeholder="Въведете имейл адрес"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                Парола
              </label>
              <div className={styles.inputWrapper}>
                <div className={styles.inputWrapperWithIcon}>
                  <Lock className={styles.inputIcon} size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`${styles.input} ${styles.inputWithPasswordToggle}`}
                    placeholder="Въведете парола"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className={styles.passwordToggle}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !formData.username.trim() || !formData.password.trim()}
              className={styles.submitButton}
            >
              {isLoading ? (
                <>
                  <div className={styles.loadingSpinner}></div>
                  <span>Влизане...</span>
                </>
              ) : (
                <span>Влезте в системата</span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className={styles.footer}>
            <p className={styles.footerText}>
              © {new Date().getFullYear()} Pizza Stop — Защитен административен достъп
            </p>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className={styles.backLink}>
          <button
            onClick={() => router.push('/')}
            className={styles.backLinkButton}
          >
            ← Обратно към началната страница
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;