import { GlassShowcase } from '../../components/glass';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Glassmorphism Design System — ApexGlass',
  description: 'Layered translucent spatial interface system inspired by visionOS and Fluent Design',
};

export default function GlassPage() {
  return <GlassShowcase />;
}
