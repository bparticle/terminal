import type { Metadata } from 'next';
import GameTerminal from './GameTerminal';

export const metadata: Metadata = {
  title: 'Terminal Game',
  description: 'A retro CRT terminal text adventure game',
};

export default function TerminalPage() {
  return <GameTerminal />;
}
