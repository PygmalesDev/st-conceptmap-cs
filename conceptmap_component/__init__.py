import os
import streamlit.components.v1 as components
from typing import Any, Dict
from collections import defaultdict

_RELEASE = True

if not _RELEASE:
    _component_func = components.declare_component("conceptmap_component", url="http://localhost:3001")
else:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/build")
    _component_func = components.declare_component("conceptmap_component", path=build_dir)


def conceptmap_component(cm_data: Dict[str, Any], submit_request:bool=False, key:Any=None):
    
    component_value = _component_func(cm_data=cm_data, submit_request=submit_request, key=key, default=0)

    return component_value


def parse_conceptmap(cm: Dict[str, Any]) -> Dict[str, Any]:
    parsed_cm = defaultdict(list)

    elements = cm["elements"]
    nodes = map(lambda n: n["data"], elements["nodes"]) 
    edges = map(lambda e: e["data"], elements["edges"])
    
    edges_mapping = [(e["source"], e["target"], e["label"]) for e in edges]
    nodes_mapping = {n["id"]: n["label"] for n in nodes}
    parsed_cm["nodes"] = list(nodes_mapping.values())
    parsed_cm["edges"] = [{
        "source":   nodes_mapping[sid], 
        "target":   nodes_mapping[tid],
        "relation": relation
        } for sid, tid, relation in edges_mapping]

    return parsed_cm

