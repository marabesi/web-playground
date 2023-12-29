import {render, waitFor, waitForElementToBeRemoved} from '@testing-library/react';
import App from './App';
import userEvent from "@testing-library/user-event";

describe('web workers', () => {
  it('should show loading while computing large number', async () => {
    const {getByText, getByTestId} = render(<App/>);

    await userEvent.click(getByText(/Click me, no worker/));

    await waitFor(() => {
      expect(getByTestId('loading')).toBeInTheDocument()
    });
  });

  it('should hide loading after computing large number', async () => {
    const {getByText, queryByTestId} = render(<App/>);

    await userEvent.click(getByText(/Click me, no worker/));

    await waitForElementToBeRemoved(() => queryByTestId('loading'));
  });
});
