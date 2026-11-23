import { Component, type ErrorInfo, type ReactNode } from 'react';

import { ErrorState } from '@/ui/ErrorState';

import type { Logger } from './logger';

type Props = {
  logger: Logger;
  children: ReactNode;
  /** своя заглушка вместо общей ErrorState */
  fallback?: (reset: () => void) => ReactNode;
};

type State = { failed: boolean };

/**
 * ошибка рендера не должна давать белый экран: показываем заглушку с «Повторить»
 * и пишем в лог стек и дерево компонентов
 */
export class LoggingErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.logger.error('render error', error, {
      componentStack: info.componentStack?.split('\n').slice(0, 8).join('\n'),
    });
  }

  reset = () => {
    this.props.logger.info('error boundary reset');
    this.setState({ failed: false });
  };

  render() {
    if (!this.state.failed) return this.props.children;
    return this.props.fallback ? this.props.fallback(this.reset) : <ErrorState onRetry={this.reset} />;
  }
}
