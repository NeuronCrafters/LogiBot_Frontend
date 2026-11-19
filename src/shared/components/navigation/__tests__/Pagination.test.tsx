import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { chooseLanguage } from "@/i18n";
import { Pagination } from "@/shared/components/navigation/Pagination";
import { pageWindow } from "@/shared/components/navigation/pageWindow";

beforeEach(() => chooseLanguage("pt-BR"));

it("shows the first, last and neighbouring pages with gaps", () => {
  expect(pageWindow(1, 1)).toEqual([1]);
  expect(pageWindow(1, 4)).toEqual([1, 2, 3, 4]);
  expect(pageWindow(5, 10)).toEqual([1, "gap", 4, 5, 6, "gap", 10]);
  expect(pageWindow(10, 10)).toEqual([1, "gap", 9, 10]);
});

it("announces the range and moves between pages", () => {
  const onPageChange = vi.fn();
  const onPageSizeChange = vi.fn();
  render(<Pagination page={2} totalPages={3} total={30} pageSize={12} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} label="Paginação dos feedbacks" />);
  expect(screen.getByText("Mostrando 13–24 de 30")).toHaveAttribute("aria-live", "polite");
  const nav = screen.getByRole("navigation", { name: "Paginação dos feedbacks" });
  expect(nav).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Página 2" })).toHaveAttribute("aria-current", "page");
  fireEvent.click(screen.getByRole("button", { name: "Próxima" }));
  fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
  fireEvent.click(screen.getByRole("button", { name: "Página 3" }));
  expect(onPageChange.mock.calls).toEqual([[3], [1], [3]]);
  fireEvent.change(screen.getByLabelText("Por página"), { target: { value: "24" } });
  expect(onPageSizeChange).toHaveBeenCalledWith(24);
});

it("disables the ends and hides navigation when there is a single page", () => {
  const { rerender } = render(<Pagination page={3} totalPages={3} total={30} pageSize={12} onPageChange={() => {}} />);
  expect(screen.getByRole("button", { name: "Próxima" })).toBeDisabled();
  rerender(<Pagination page={1} totalPages={1} total={5} pageSize={12} onPageChange={() => {}} />);
  expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  expect(screen.getByText("Mostrando 1–5 de 5")).toBeInTheDocument();
});
