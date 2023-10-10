import { render } from '@testing-library/react';
import App from './App';

describe('web workers', () => {
  it('should show loading while computing large number', async () => {
    const {getByText, getByTestId} = render(<App/>);
  });
});
