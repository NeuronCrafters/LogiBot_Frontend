import { act, fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { LocalizedValidation } from "../LocalizedValidation";
import { chooseLanguage, t } from "..";

it("localiza validação nativa sem prender o campo inválido ou apagar o valor", () => {
  act(() => chooseLanguage("en-US"));
  render(<><LocalizedValidation /><input aria-label="email" required type="email" defaultValue="invalid" /></>);
  const input = screen.getByRole("textbox") as HTMLInputElement;
  expect(input.checkValidity()).toBe(false);
  expect(input.validationMessage).toBe(t("validation.email"));
  act(() => chooseLanguage("es-ES"));
  expect(input.value).toBe("invalid");
  expect(input.checkValidity()).toBe(false);
  expect(input.validationMessage).toBe(t("validation.email"));
  fireEvent.input(input, { target: { value: "joao@example.invalid" } });
  expect(input.checkValidity()).toBe(true);
  fireEvent.input(input, { target: { value: "" } });
  expect(input.checkValidity()).toBe(false);
  expect(input.validationMessage).toBe(t("validation.required"));
});
