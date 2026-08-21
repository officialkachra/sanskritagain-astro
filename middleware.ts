import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase();

  if (host === "astro.sanskritagain.com" && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/ved";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/"
};
