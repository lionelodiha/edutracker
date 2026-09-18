import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Modal from "./Modal";

function renderModal(onClose: () => void = () => {}) {
  return render(
    <Modal titleId="test-title" onClose={onClose}>
      <h2 id="test-title">Test Dialog</h2>
      <button type="button">Inside</button>
    </Modal>,
  );
}

describe("Modal", () => {
  afterEach(() => {
    // Belt and braces: the lock/restore round-trip is asserted in its own
    // test below. This just guarantees no leaked inline style can pollute a
    // later test if an assertion above throws before unmount.
    document.body.style.overflow = "";
  });

  it("renders as a labelled dialog", () => {
    renderModal();

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "test-title");
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    renderModal(onClose);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when the overlay itself is clicked", () => {
    const onClose = vi.fn();
    renderModal(onClose);

    // pointerdown outside the content, released outside: a real overlay click.
    fireEvent.pointerDown(screen.getByRole("dialog"));
    fireEvent.click(screen.getByRole("dialog"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when a drag starts inside and releases outside", () => {
    const onClose = vi.fn();
    renderModal(onClose);

    // Selecting text inside the form and releasing outside must not destroy
    // what the user typed.
    fireEvent.pointerDown(screen.getByRole("button", { name: "Inside" }));
    fireEvent.click(screen.getByRole("dialog"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("locks body scroll while open and restores it on close", () => {
    const { unmount } = renderModal();

    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    expect(document.body.style.overflow).toBe("");
  });
});
