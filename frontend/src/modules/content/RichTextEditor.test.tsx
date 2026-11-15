// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ContentDoc } from "@/types/content";
import { RichTextEditor } from "./RichTextEditor";

// Mock MediaPickerModal to control selection and closure
vi.mock("@/modules/media/MediaPickerModal", () => ({
  MediaPickerModal: ({
    onSelect,
    onClose,
  }: {
    onSelect: (media: { url: string; altText: string; id: string }) => void;
    onClose: () => void;
  }) => (
    <div data-testid="media-picker-modal">
      <button
        type="button"
        data-testid="select-image-1"
        onClick={() =>
          onSelect({
            url: "/media/img1.png",
            altText: "Image 1",
            id: "media-1",
          })
        }
      >
        Select 1
      </button>
      <button
        type="button"
        data-testid="select-image-2"
        onClick={() =>
          onSelect({
            url: "/media/img2.png",
            altText: "Image 2",
            id: "media-2",
          })
        }
      >
        Select 2
      </button>
      <button type="button" data-testid="cancel-picker" onClick={onClose}>
        Cancel
      </button>
    </div>
  ),
}));

describe("RichTextEditor image insertion", () => {
  const initialDoc: ContentDoc = {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "Initial text" }] }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the editor with toolbar buttons", () => {
    const handleChange = vi.fn();
    render(<RichTextEditor value={initialDoc} onChange={handleChange} />);

    expect(screen.getByRole("toolbar", { name: "Formatting" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Insert image" })).toBeTruthy();
  });

  it("opens media picker modal when 'Insert image' is clicked", () => {
    const handleChange = vi.fn();
    render(<RichTextEditor value={initialDoc} onChange={handleChange} />);

    const insertBtn = screen.getByRole("button", { name: "Insert image" });
    fireEvent.click(insertBtn);

    expect(screen.getByTestId("media-picker-modal")).toBeTruthy();
  });

  it("inserts an image and closes the picker", () => {
    let currentDoc = initialDoc;
    const handleChange = vi.fn((doc: ContentDoc) => {
      currentDoc = doc;
    });

    render(<RichTextEditor value={initialDoc} onChange={handleChange} />);

    // Click insert image
    fireEvent.click(screen.getByRole("button", { name: "Insert image" }));

    // Select first image
    fireEvent.click(screen.getByTestId("select-image-1"));

    expect(screen.queryByTestId("media-picker-modal")).toBeNull();
    expect(handleChange).toHaveBeenCalled();

    const imageNode = currentDoc.content?.find((node) => node.type === "image");
    expect(imageNode).toBeDefined();
    expect(imageNode?.attrs?.src).toBe("/media/img1.png");
    expect(imageNode?.attrs?.mediaId).toBe("media-1");
  });

  it("preserves previous image when inserting consecutive images", () => {
    let currentDoc = initialDoc;
    const handleChange = vi.fn((doc: ContentDoc) => {
      currentDoc = doc;
    });

    render(<RichTextEditor value={initialDoc} onChange={handleChange} />);

    // Insert 1st image
    fireEvent.click(screen.getByRole("button", { name: "Insert image" }));
    fireEvent.click(screen.getByTestId("select-image-1"));

    // Immediately insert 2nd image without moving cursor
    fireEvent.click(screen.getByRole("button", { name: "Insert image" }));
    fireEvent.click(screen.getByTestId("select-image-2"));

    const imageNodes = currentDoc.content?.filter((node) => node.type === "image") ?? [];
    expect(imageNodes).toHaveLength(2);
    expect(imageNodes[0]?.attrs?.mediaId).toBe("media-1");
    expect(imageNodes[1]?.attrs?.mediaId).toBe("media-2");
  });

  it("closes modal on cancel without inserting an image", () => {
    const handleChange = vi.fn();
    render(<RichTextEditor value={initialDoc} onChange={handleChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Insert image" }));
    expect(screen.getByTestId("media-picker-modal")).toBeTruthy();

    fireEvent.click(screen.getByTestId("cancel-picker"));
    expect(screen.queryByTestId("media-picker-modal")).toBeNull();
    expect(handleChange).not.toHaveBeenCalled();
  });
});
