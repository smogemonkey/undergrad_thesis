import React, { useEffect, useMemo, useRef, useState } from "react";
import { Controls, Handle, Position, ReactFlow } from "@xyflow/react";
import { v4 as uuidv4 } from "uuid";
import { Spin, theme } from "antd";
import "@xyflow/react/dist/style.css";
import buildApi from "../../api/build";

const countLeafNodes = (comp) => {
  if (comp.dependsOn.length === 0) {
    return 1;
  }
  return comp.dependsOn.reduce((acc, item) => acc + countLeafNodes(item), 0);
};

const w = 20;
const h = 28;

function Board({ buildId }) {
  const {
    token: { colorBgContainer, colorBorder },
  } = theme.useToken();

  const dependencies = useRef([]);
  const tree = useRef({});
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const fetchDependencies = async () => {
    const data = await buildApi.getDependenciesByBuildId(buildId);
    dependencies.current = data;
  };

  useEffect(() => {
    const update = async () => {
      setLoading(true);
      await fetchDependencies();
      tree.current = { id: uuidv4(), ref: dependencies.current[0].ref, dependsOn: [] };
      updateRender();
      setLoading(false);
    }
    update();
  }, [buildId]);

  const updateRender = () => {
    const treeRender = renderTree(tree.current, 0, (countLeafNodes(tree.current) * h) / 2);
    setNodes(treeRender.nodes);
    setEdges(treeRender.edges);
  };

  const renderTree = (root, x, y) => {
    const nodes = [];
    const edges = [];
    const hasDependencies = findDependency(root.ref).dependsOn.length > 0;
    nodes.push({
      id: root.id,
      position: { x, y },
      data: { label: root.ref.split("?")[0], hasDependencies },
      type: "customNode",
    });
    const cd = countLeafNodes(root) * h;
    let current = 0;
    root.dependsOn.forEach((item, idx) => {
      const child = renderTree(
        item,
        x + root.ref.length * 8 + w,
        y - cd / 2 + (countLeafNodes(item) * h) / 2 + current
      );
      current += countLeafNodes(item) * h;
      const childNodes = child.nodes;
      const childEdges = child.edges;
      nodes.push(...childNodes);
      edges.push({
        id: `${root.id}-${item.id}`,
        source: root.id,
        target: item.id,
      });
      edges.push(...childEdges);
    });
    return { nodes, edges };
  };

  const findDependency = (ref) => {
    return dependencies.current.find((dep) => dep.ref === ref);
  };

  const findTreeById = (id, tree) => {
    if (tree.id === id) {
      return tree;
    }
    for (let i = 0; i < tree.dependsOn.length; i++) {
      const result = findTreeById(id, tree.dependsOn[i]);
      if (result) {
        return result;
      }
    }
    return null;
  };

  const handleClick = (id) => {
    const newTree = { ...tree.current };
    const subTree = findTreeById(id, newTree);
    if (subTree.dependsOn.length === 0) {
      const newDep = findDependency(subTree.ref).dependsOn.map((dep) => ({
        id: uuidv4(),
        ref: dep,
        dependsOn: [],
      }));
      subTree.dependsOn.push(...newDep);
    } else {
      subTree.dependsOn.splice(0, subTree.dependsOn.length);
    }
    tree.current = newTree;
    updateRender();
  };

  function CustomNode({ data, id }) {
    return (
      <div
        onClick={() => {
          console.log(id);
          handleClick(id);
        }}
      >
        <Handle type="target" position={Position.Left} />
        <div
          style={{
            border: "1px solid " + colorBorder,
            borderRadius: "4px",
            padding: "0px 4px",
          }}
        >
          {data.label}
        </div>
        {data.hasDependencies && (
          <Handle type="source" position={Position.Right} id="a" />
        )}
      </div>
    );
  }

  const nodeTypes = useMemo(() => ({ customNode: CustomNode }), [buildId]);
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {loading ? (
        <Spin />
      ) : (
        <ReactFlow
          style={{
            background: colorBgContainer,
            width: "100%",
            height: "100%",
          }}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
        >
          <Controls />
        </ReactFlow>
      )}
    </div>
  );
}

export default Board;
