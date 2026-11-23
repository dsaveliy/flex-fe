import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithTheme } from '@/test/render';

import { PinPad } from '../PinPad';

describe('PinPad', () => {
  it('каждая цифра — отдельная кнопка с подписью для VoiceOver', async () => {
    await renderWithTheme(<PinPad onDigit={jest.fn()} onDelete={jest.fn()} />);
    for (const digit of ['0', '1', '5', '9']) {
      expect(screen.getByRole('button', { name: `Цифра ${digit}` })).toBeOnTheScreen();
    }
  });

  it('нажатия передают цифры, «Стереть» — onDelete', async () => {
    const onDigit = jest.fn();
    const onDelete = jest.fn();
    await renderWithTheme(<PinPad onDigit={onDigit} onDelete={onDelete} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Цифра 1' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Цифра 0' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Стереть' }));

    expect(onDigit.mock.calls).toEqual([['1'], ['0']]);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('disabled: нажатия игнорируются (идёт проверка PIN)', async () => {
    const onDigit = jest.fn();
    await renderWithTheme(<PinPad onDigit={onDigit} onDelete={jest.fn()} disabled />);
    await fireEvent.press(screen.getByRole('button', { name: 'Цифра 7' }));
    expect(onDigit).not.toHaveBeenCalled();
  });

  it('кнопка биометрии появляется, только если она доступна', async () => {
    const onPress = jest.fn();
    const view = await renderWithTheme(<PinPad onDigit={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.queryByRole('button', { name: 'Face ID' })).toBeNull();

    await view.rerender(
      <PinPad onDigit={jest.fn()} onDelete={jest.fn()} biometric={{ label: 'Face ID', onPress }} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Face ID' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
