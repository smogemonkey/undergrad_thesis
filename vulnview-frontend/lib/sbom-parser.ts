/**
 * Basic parser for CycloneDX SBOM files
 */

interface Component {
  type: string
  name: string
  version?: string
  purl?: string
  group?: string
  description?: string
  licenses?: any[]
  vulnerabilities?: any[]
  risk?: string
}

interface Dependency {
  ref: string
  dependsOn: string[]
}

interface ParsedSBOM {
  format: string
  version: string
  components: Component[]
  dependencies: Dependency[]
  metadata?: any
}

export async function parseCycloneDX(content: string, isXml: boolean): Promise<ParsedSBOM> {
  try {
    if (isXml) {
      // For XML, we'd use a proper XML parser in a real implementation
      // This is a simplified version that extracts basic information
      return parseXmlCycloneDX(content)
    } else {
      // Parse JSON
      return parseJsonCycloneDX(content)
    }
  } catch (error) {
    console.error("Error parsing CycloneDX:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to parse CycloneDX: ${error.message}`)
    } else {
      throw new Error('Failed to parse CycloneDX: Unknown error')
    }
  }
}

function parseJsonCycloneDX(content: string): ParsedSBOM {
  const json = JSON.parse(content)

  if (!json.bomFormat || json.bomFormat !== "CycloneDX") {
    throw new Error("Invalid CycloneDX format")
  }

  const components = (json.components || []).map((comp: any) => ({
    type: comp.type || "unknown",
    name: comp.name || "unnamed",
    version: comp.version,
    purl: comp.purl,
    group: comp.group,
    description: comp.description,
    licenses: comp.licenses,
    // Add risk level based on vulnerabilities if available
    risk: determineRiskLevel(comp),
  }))

  const dependencies = (json.dependencies || []).map((dep: any) => ({
    ref: dep.ref,
    dependsOn: dep.dependsOn || [],
  }))

  return {
    format: "CycloneDX",
    version: json.specVersion || json.version || "unknown",
    components,
    dependencies,
    metadata: json.metadata,
  }
}

function parseXmlCycloneDX(content: string): ParsedSBOM {
  // In a real implementation, we would use a proper XML parser
  // This is a simplified version that extracts basic information using regex

  // Extract version
  const versionMatch = content.match(/<bom[^>]*version="([^"]+)"/)
  const version = versionMatch ? versionMatch[1] : "unknown"

  // Extract components (simplified)
  const componentMatches = content.matchAll(/<component[^>]*type="([^"]+)"[^>]*>([\s\S]*?)<\/component>/g)
  const components: Component[] = []

  for (const match of componentMatches) {
    const type = match[1]
    const componentContent = match[2]

    const nameMatch = componentContent.match(/<name>(.*?)<\/name>/)
    const versionMatch = componentContent.match(/<version>(.*?)<\/version>/)
    const purlMatch = componentContent.match(/<purl>(.*?)<\/purl>/)

    if (nameMatch) {
      components.push({
        type,
        name: nameMatch[1],
        version: versionMatch ? versionMatch[1] : undefined,
        purl: purlMatch ? purlMatch[1] : undefined,
        risk: "unknown", // In a real implementation, we would determine this properly
      })
    }
  }

  // Extract dependencies (simplified)
  const dependencyMatches = content.matchAll(/<dependency ref="([^"]+)">([\s\S]*?)<\/dependency>/g)
  const dependencies: Dependency[] = []

  for (const match of dependencyMatches) {
    const ref = match[1]
    const dependencyContent = match[2]

    const dependsOnMatches = dependencyContent.matchAll(/<depends-on>(.*?)<\/depends-on>/g)
    const dependsOn: string[] = []

    for (const dependsOnMatch of dependsOnMatches) {
      dependsOn.push(dependsOnMatch[1])
    }

    dependencies.push({
      ref,
      dependsOn,
    })
  }

  return {
    format: "CycloneDX",
    version,
    components,
    dependencies,
  }
}

function determineRiskLevel(component: any): string {
  // In a real implementation, this would analyze vulnerabilities
  // and determine the risk level based on CVSS scores, etc.

  // For now, we'll use a simplified approach
  const vulnerabilities = component.vulnerabilities || []

  if (vulnerabilities.length === 0) {
    return "NONE"
  }

  // Check if there are any critical vulnerabilities
  const hasCritical = vulnerabilities.some((v: any) =>
    v.ratings?.some((r: any) => r.severity === "critical" || (r.score && r.score >= 9.0)),
  )

  if (hasCritical) {
    return "CRITICAL"
  }

  // Check if there are any high vulnerabilities
  const hasHigh = vulnerabilities.some((v: any) =>
    v.ratings?.some((r: any) => r.severity === "high" || (r.score && r.score >= 7.0)),
  )

  if (hasHigh) {
    return "HIGH"
  }

  // Check if there are any medium vulnerabilities
  const hasMedium = vulnerabilities.some((v: any) =>
    v.ratings?.some((r: any) => r.severity === "medium" || (r.score && r.score >= 4.0)),
  )

  if (hasMedium) {
    return "MEDIUM"
  }

  return "LOW"
}
