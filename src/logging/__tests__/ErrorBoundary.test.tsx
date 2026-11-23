import { fireEvent, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { Text } from 'react-native';

import { renderWithTheme } from '@/test/render';

import { LoggingErrorBoundary } from '../ErrorBoundary';
import type { Logger } from '../logger';

function fakeLogger(): jest.Mocked<Logger> {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn(),
  } as jest.Mocked<Logger>;
  logger.child.mockReturnValue(logger);
  return logger;
}

let shouldThrow = true;
function Flaky() {
  if (shouldThrow) throw new Error('balance is undefined');
  return <Text>Баланс</Text>;
}

describe('LoggingErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = true;
    // React пишет пойманную ошибку в console.error — в выводе тестов это шум
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('вместо белого экрана — заглушка, ошибка уходит в лог со стеком компонентов', async () => {
    const logger = fakeLogger();
    await renderWithTheme(
      <LoggingErrorBoundary logger={logger}>
        <Flaky />
      </LoggingErrorBoundary>,
    );

    expect(screen.getByText('Что-то пошло не так')).toBeOnTheScreen();
    expect(logger.error).toHaveBeenCalledWith(
      'render error',
      expect.objectContaining({ message: 'balance is undefined' }),
      expect.objectContaining({ componentStack: expect.stringContaining('Flaky') }),
    );
  });

  it('«Повторить» перерисовывает дерево и пишет info', async () => {
    const logger = fakeLogger();
    await renderWithTheme(
      <LoggingErrorBoundary logger={logger}>
        <Flaky />
      </LoggingErrorBoundary>,
    );
    shouldThrow = false;
    await fireEvent.press(screen.getByText('Повторить'));

    expect(screen.getByText('Баланс')).toBeOnTheScreen();
    expect(logger.info).toHaveBeenCalledWith('error boundary reset');
  });

  it('без ошибки рендерит детей и ничего не пишет', async () => {
    const logger = fakeLogger();
    function Ok() {
      const [text] = useState('Главная');
      return <Text>{text}</Text>;
    }
    await renderWithTheme(
      <LoggingErrorBoundary logger={logger}>
        <Ok />
      </LoggingErrorBoundary>,
    );
    expect(screen.getByText('Главная')).toBeOnTheScreen();
    expect(logger.error).not.toHaveBeenCalled();
  });
});
