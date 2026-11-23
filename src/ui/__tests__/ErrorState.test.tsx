import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithTheme as render } from '@/test/render';

import { ErrorState } from '../ErrorState';

describe('ErrorState', () => {
  it('показывает заголовок и подсказку на языке устройства', async () => {
    await render(<ErrorState />);
    expect(screen.getByText('Что-то пошло не так')).toBeOnTheScreen();
    expect(screen.getByText('Проверьте соединение и попробуйте снова.')).toBeOnTheScreen();
  });

  it('без onRetry кнопки «Повторить» нет', async () => {
    await render(<ErrorState />);
    expect(screen.queryByText('Повторить')).toBeNull();
  });

  it('нажатие «Повторить» вызывает onRetry один раз', async () => {
    const onRetry = jest.fn();
    await render(<ErrorState onRetry={onRetry} />);
    await fireEvent.press(screen.getByText('Повторить'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
