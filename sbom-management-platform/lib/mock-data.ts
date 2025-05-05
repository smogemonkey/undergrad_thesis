// Generate a more complex dataset for the visualization
function generateComplexGraph() {
  const mainNodes = [
    { id: "main", name: "jenkins-core", size: 25, risk: "safe" },
    { id: "spring-core", name: "spring-core", size: 20, risk: "safe" },
    { id: "log4j", name: "log4j-core", size: 18, risk: "critical" },
    { id: "commons-io", name: "commons-io", size: 15, risk: "safe" },
    { id: "guava", name: "guava", size: 17, risk: "low" },
  ]

  const secondaryNodes = [
    { id: "spring-beans", name: "spring-beans", size: 12, risk: "safe" },
    { id: "spring-context", name: "spring-context", size: 12, risk: "safe" },
    { id: "spring-aop", name: "spring-aop", size: 10, risk: "safe" },
    { id: "log4j-api", name: "log4j-api", size: 10, risk: "high" },
    { id: "jackson-core", name: "jackson-core", size: 12, risk: "medium" },
    { id: "commons-lang", name: "commons-lang", size: 10, risk: "safe" },
    { id: "failureaccess", name: "failureaccess", size: 8, risk: "safe" },
    { id: "listenablefuture", name: "listenablefuture", size: 8, risk: "safe" },
    { id: "jackson-databind", name: "jackson-databind", size: 12, risk: "high" },
    { id: "netty", name: "netty", size: 14, risk: "medium" },
    { id: "commons-text", name: "commons-text", size: 10, risk: "critical" },
  ]

  // Generate tertiary nodes
  const tertiaryNodes = Array.from({ length: 80 }, (_, i) => ({
    id: `dep-${i + 1}`,
    name: `dependency-${i + 1}`,
    size: Math.random() * 5 + 5,
    risk: ["safe", "low", "medium", "high", "critical"][Math.floor(Math.random() * 5)],
  }))

  // Combine all nodes
  const nodes = [...mainNodes, ...secondaryNodes, ...tertiaryNodes]

  // Create main connections
  const mainLinks = [
    { source: "main", target: "spring-core", value: 3 },
    { source: "main", target: "log4j", value: 3 },
    { source: "main", target: "commons-io", value: 2 },
    { source: "main", target: "guava", value: 2 },
    { source: "spring-core", target: "spring-beans", value: 2 },
    { source: "spring-core", target: "spring-context", value: 2 },
    { source: "spring-core", target: "spring-aop", value: 2 },
    { source: "log4j", target: "log4j-api", value: 2 },
    { source: "log4j", target: "jackson-core", value: 1 },
    { source: "commons-io", target: "commons-lang", value: 1 },
    { source: "guava", target: "failureaccess", value: 1 },
    { source: "guava", target: "listenablefuture", value: 1 },
    { source: "spring-core", target: "jackson-databind", value: 2 },
    { source: "log4j", target: "netty", value: 1 },
    { source: "commons-io", target: "commons-text", value: 1 },
    { source: "jackson-databind", target: "jackson-core", value: 2 },
  ]

  // Generate connections between secondary and tertiary nodes
  const secondaryLinks = []

  // Connect each secondary node to multiple tertiary nodes
  secondaryNodes.forEach((secondaryNode) => {
    // Determine how many connections this node will have (3-8)
    const connectionCount = Math.floor(Math.random() * 6) + 3

    // Create connections to random tertiary nodes
    for (let i = 0; i < connectionCount; i++) {
      const targetIndex = Math.floor(Math.random() * tertiaryNodes.length)
      secondaryLinks.push({
        source: secondaryNode.id,
        target: tertiaryNodes[targetIndex].id,
        value: Math.random() > 0.7 ? 2 : 1, // Occasionally make stronger connections
      })
    }
  })

  // Create some tertiary-to-tertiary connections for more complexity
  const tertiaryLinks = []
  for (let i = 0; i < 40; i++) {
    const sourceIndex = Math.floor(Math.random() * tertiaryNodes.length)
    let targetIndex
    do {
      targetIndex = Math.floor(Math.random() * tertiaryNodes.length)
    } while (targetIndex === sourceIndex) // Avoid self-connections

    tertiaryLinks.push({
      source: tertiaryNodes[sourceIndex].id,
      target: tertiaryNodes[targetIndex].id,
      value: 1,
    })
  }

  // Connect some tertiary nodes directly to main nodes
  const directMainLinks = []
  for (let i = 0; i < 15; i++) {
    const mainIndex = Math.floor(Math.random() * mainNodes.length)
    const tertiaryIndex = Math.floor(Math.random() * tertiaryNodes.length)

    directMainLinks.push({
      source: mainNodes[mainIndex].id,
      target: tertiaryNodes[tertiaryIndex].id,
      value: 1,
    })
  }

  // Combine all links
  const links = [...mainLinks, ...secondaryLinks, ...tertiaryLinks, ...directMainLinks]

  return { nodes, links }
}

export const mockGraphData = generateComplexGraph()
