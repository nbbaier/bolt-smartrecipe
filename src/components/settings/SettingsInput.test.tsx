// biome-ignore-all assist/source/organizeImports: needed for testing
// @ts-nocheck
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it, vi } from "vitest";
import { SettingsInput } from "./SettingsInput";

describe("SettingsInput", () => {
  describe("number type", () => {
    it("renders number input with label", () => {
      render(
        <SettingsInput
          label="Test Setting"
          value={5}
          onChange={vi.fn()}
          type="number"
          min={1}
          max={10}
        />,
      );

      expect(screen.getByText("Test Setting")).toBeInTheDocument();
      expect(screen.getByDisplayValue("5")).toBeInTheDocument();
    });

    it("calls onChange when value changes", () => {
      const onChange = vi.fn();
      render(
        <SettingsInput
          label="Test Setting"
          value={5}
          onChange={onChange}
          type="number"
          min={1}
          max={10}
        />,
      );

      const input = screen.getByDisplayValue("5");
      fireEvent.change(input, { target: { value: "7" } });

      expect(onChange).toHaveBeenCalledWith(7);
    });

    it("disables input when loading", () => {
      render(
        <SettingsInput
          label="Test Setting"
          value={5}
          onChange={vi.fn()}
          type="number"
          loading={true}
        />,
      );

      const input = screen.getByDisplayValue("5");
      expect(input).toBeDisabled();
    });
  });

  describe("checkbox type", () => {
    it("renders checkbox with label", () => {
      render(
        <SettingsInput
          label="Enable Feature"
          value={true}
          onChange={vi.fn()}
          type="checkbox"
        />,
      );

      expect(screen.getByText("Enable Feature")).toBeInTheDocument();
      expect(screen.getByRole("checkbox")).toBeChecked();
    });

    it("calls onChange with boolean value", () => {
      const onChange = vi.fn();
      render(
        <SettingsInput
          label="Enable Feature"
          value={false}
          onChange={onChange}
          type="checkbox"
        />,
      );

      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);

      expect(onChange).toHaveBeenCalled();
    });

    it("disables checkbox when loading", () => {
      render(
        <SettingsInput
          label="Enable Feature"
          value={true}
          onChange={vi.fn()}
          type="checkbox"
          loading={true}
        />,
      );

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeDisabled();
    });
  });
});
