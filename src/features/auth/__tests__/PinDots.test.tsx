import { screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import { renderWithTheme } from '@/test/render';
import { darkTheme } from '@/theme';

import { PinDots } from '../PinDots';

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Error: 'error' },
}));

describe('PinDots', () => {
  beforeEach(() => jest.clearAllMocks());

  it('озвучивает, сколько цифр введено, и закрашивает столько же точек', async () => {
    await renderWithTheme(<PinDots length={6} filled={2} errorKey={0} />);
    const group = screen.getByLabelText(/2.*6/);
    const dots = group.children as unknown as { props: { style: { backgroundColor: string } } }[];
    expect(dots).toHaveLength(6);
    expect(dots.map((dot) => dot.props.style.backgroundColor)).toEqual([
      darkTheme.colors.accent,
      darkTheme.colors.accent,
      'transparent',
      'transparent',
      'transparent',
      'transparent',
    ]);
  });

  it('новая ошибка (errorKey растёт) — вибрация; первый показ без вибрации', async () => {
    const view = await renderWithTheme(<PinDots length={6} filled={6} errorKey={0} />);
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    await view.rerender(<PinDots length={6} filled={0} errorKey={1} />);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('error');
  });
});
