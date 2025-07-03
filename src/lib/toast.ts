export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

class ToastManager {
  private toasts: Set<(options: ToastOptions) => void> = new Set();

  subscribe(callback: (options: ToastOptions) => void) {
    this.toasts.add(callback);
    return () => this.toasts.delete(callback);
  }

  show(options: ToastOptions) {
    this.toasts.forEach(callback => callback(options));
  }

  success(title: string, description?: string) {
    this.show({ title, description, variant: 'success' });
  }

  error(title: string, description?: string) {
    this.show({ title, description, variant: 'destructive' });
  }

  info(title: string, description?: string) {
    this.show({ title, description, variant: 'default' });
  }
}

export const toast = new ToastManager();