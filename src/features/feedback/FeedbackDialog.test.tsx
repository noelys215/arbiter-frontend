import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FeedbackDialog from "./FeedbackDialog";

const mocks = vi.hoisted(() => ({ submitFeedback: vi.fn() }));

vi.mock("./feedback.api", async (importOriginal) => {
  const original = await importOriginal<typeof import("./feedback.api")>();
  return { ...original, submitFeedback: mocks.submitFeedback };
});

function renderDialog(options?: { authenticated?: boolean }) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <FeedbackDialog
        isOpen
        onOpenChange={vi.fn()}
        source={options?.authenticated ? "account_profile" : "landing_footer"}
        isAuthenticated={options?.authenticated}
        selectedGroupId={options?.authenticated ? "group-id" : undefined}
      />
    </QueryClientProvider>,
  );
}

describe("FeedbackDialog", () => {
  beforeEach(() => {
    mocks.submitFeedback.mockReset();
    mocks.submitFeedback.mockResolvedValue({ ok: true });
  });

  it("keeps contact details opt-in for a signed-out visitor", async () => {
    const user = userEvent.setup();
    renderDialog();

    expect(screen.queryByLabelText("Email for a reply")).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("checkbox", {
        name: "You may contact me about this feedback",
      }),
    );
    expect(screen.getByLabelText("Email for a reply")).toBeInTheDocument();

    await user.type(
      screen.getByLabelText("What would you like to share?"),
      "The group picker is clear and easy to use.",
    );
    await user.type(screen.getByLabelText("Email for a reply"), "user@example.com");
    await user.click(screen.getByRole("button", { name: "Send feedback" }));

    await waitFor(() => expect(mocks.submitFeedback).toHaveBeenCalledOnce());
    expect(mocks.submitFeedback.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        allow_contact: true,
        contact_email: "user@example.com",
      }),
    );
  });

  it("never submits an authenticated email from the browser", async () => {
    const user = userEvent.setup();
    renderDialog({ authenticated: true });

    await user.click(
      screen.getByRole("checkbox", {
        name: "Use my account email for a reply",
      }),
    );
    await user.type(
      screen.getByLabelText("What would you like to share?"),
      "Please keep the current warm visual style.",
    );
    await user.click(screen.getByRole("button", { name: "Send feedback" }));

    await waitFor(() => expect(mocks.submitFeedback).toHaveBeenCalledOnce());
    const payload = mocks.submitFeedback.mock.calls[0][0];
    expect(payload.allow_contact).toBe(true);
    expect(payload).not.toHaveProperty("contact_email");
    expect(payload).not.toHaveProperty("user_id");
  });

  it("defaults diagnostics on for bug reports and keeps the honeypot hidden", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("radio", { name: "Bug report" }));
    expect(
      screen.getByRole("checkbox", {
        name: "Include technical details",
      }),
    ).toBeChecked();
    const honeypot = document.querySelector<HTMLInputElement>('input[name="website"]');
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot).toHaveAttribute("aria-hidden", "true");
  });

  it("preserves the message after a recoverable delivery failure", async () => {
    mocks.submitFeedback.mockRejectedValueOnce(Object.assign(new Error("failed"), { status: 503 }));
    renderDialog();
    const message = screen.getByLabelText("What would you like to share?");
    fireEvent.change(message, {
      target: { value: "The shortlist did not refresh for another member." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn’t send your feedback. Please try again.",
    );
    expect(message).toHaveValue("The shortlist did not refresh for another member.");
  });

  it("shows the approved success state without promising contact", async () => {
    renderDialog();
    fireEvent.change(screen.getByLabelText("What would you like to share?"), {
      target: { value: "The new invitation page feels much clearer." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));

    expect(
      await screen.findByRole("heading", {
        name: "Thanks for helping improve Arbiter.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Your feedback has been sent.")).toBeInTheDocument();
    expect(screen.queryByText(/We may follow up/)).not.toBeInTheDocument();
  });
});
