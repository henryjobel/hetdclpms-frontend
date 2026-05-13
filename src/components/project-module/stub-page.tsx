"use client";
import Link from "next/link";
import { Construction } from "lucide-react";

interface StubPageProps {
  title: string;
  description?: string;
}

export function StubPage({ title, description }: StubPageProps) {
  return (
    <div className="p-6">
      <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
        <div className="w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center mx-auto mb-4">
          <Construction className="w-8 h-8 text-violet-500" />
        </div>
        <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
        <p className="text-gray-400 mt-2 text-sm">
          {description ?? "This module is currently under development."}
        </p>
        <Link
          href="/project-module"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
