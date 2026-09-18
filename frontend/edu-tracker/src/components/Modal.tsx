import { useEffect, useRef } from "react";

type ModalProps = {
    titleId: string;
    onClose: () => void;
    children: React.ReactNode;
    maxWidth?: number;
};

export default function Modal({ titleId, onClose, children, maxWidth }: ModalProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const pointerDownInside = useRef(false);
    // onClose is an inline closure at both call sites, so it is a new
    // function on every parent render (i.e. every keystroke). Reading it
    // through a ref keeps the effect below mount-only: without this the
    // effect re-ran per keystroke and focus() yanked the caret out of
    // whatever input the user was typing in. Assigned in an effect (not
    // during render) so the ref is always current without breaking the
    // rules of hooks.
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    });

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCloseRef.current();
        };
        document.addEventListener("keydown", onKeyDown);

        // Lock the page behind the dialog. Without this the background
        // scrolls under your cursor while the modal sits still.
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        // Move focus into the dialog so a keyboard user is not still on the
        // button behind it.
        contentRef.current?.focus();

        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    return (
        <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            // Track where the gesture STARTED. Closing on a plain click means
            // selecting text inside the form and releasing outside destroys
            // everything the user typed.
            onPointerDown={(e) => {
                pointerDownInside.current = contentRef.current?.contains(e.target as Node) ?? false;
            }}
            onClick={() => {
                if (!pointerDownInside.current) onCloseRef.current();
            }}
        >
            <div
                ref={contentRef}
                className="modal-content"
                tabIndex={-1}
                style={maxWidth ? { maxWidth } : undefined}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}
