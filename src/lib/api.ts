import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "./auth";
import { ScryfallError } from "./scryfall";
import { MoxfieldError } from "./moxfield";
import { DeckWriteError } from "./deckWrite";

/** Wrap a route handler so thrown errors become tidy JSON responses. */
export function handle<T extends unknown[]>(
  fn: (...args: T) => Promise<NextResponse>,
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: "Invalid input.", issues: err.flatten() },
          { status: 400 },
        );
      }
      if (err instanceof AuthError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      if (err instanceof MoxfieldError || err instanceof DeckWriteError) {
        return NextResponse.json({ error: err.message }, { status: 422 });
      }
      if (err instanceof ScryfallError) {
        return NextResponse.json(
          { error: `Scryfall error: ${err.message}` },
          { status: 502 },
        );
      }
      console.error(err);
      return NextResponse.json(
        { error: "Something went wrong on the server." },
        { status: 500 },
      );
    }
  };
}

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}
