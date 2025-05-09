import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders Semantic Engine header", () => {
  render(<App />);
  // Use a more specific query to get exactly the header element
  const headerElement = screen.getByText(/^Semantic Engine$/);
  expect(headerElement).toBeInTheDocument();
});

test("renders schema value statement", () => {
  render(<App />);
  const valueStatement = screen.getByText(/Schemas add value to data/i);
  expect(valueStatement).toBeInTheDocument();
});
