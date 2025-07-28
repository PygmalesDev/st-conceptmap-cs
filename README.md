# st-conceptmap-cs

Streamlit component based on Cytoscape.js that allows for creation and editing of concept maps


## Installation instructions

```sh
pip install st-conceptmap-cs
```

## Usage instructions

```python
import streamlit as st 
from conceptmap_component import conceptmap_component, parse_contextmap

cm_data = {
    "elements": [
        { "data": { "id": "a", "label": "Node A" } },
        { "data": { "id": "b", "label": "Node B" } },
        { "data": { "source": "a", "target": "b", "label": "A to B" } }
    ]
}

st.header("Scaffolding")

st.subheader("Task 1")
st.write("Create a concept map!")

submit_requested = st.button("Submit")

cm_response = conceptmap_component(cm_data=cm_data, submit_request=submit_requested, key="task_1")

if cm_response:
    st.write(parse_contextmap(cm_response))
    st.markdown("---")

    st.subheader("Task 2")
    st.write("Response: ")
    st.write("Make changes in your concept map based on the response")
    conceptmap_component(cm_data=cm_response, key="task_2")
```
