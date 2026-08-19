import React from 'react'

import { FeatureCard } from '@/components/FeatureCard/FeatureCard'

import './FeatureGrid.css'

type Feature = {
  title: string
  description: string
}

type FeatureGridProps = {
  features: Feature[]
}

export function FeatureGrid({ features }: FeatureGridProps) {
  return (
    <section className="feature-grid">
      {features.map((feature) => (
        <FeatureCard key={feature.title} title={feature.title} description={feature.description} />
      ))}
    </section>
  )
}
