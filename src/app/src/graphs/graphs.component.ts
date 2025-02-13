import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-graphs',
  imports: [],
  templateUrl: './graphs.component.html',
  styleUrl: './graphs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GraphsComponent {

private nodeCount = 0;
        private nodes = [];
        private connections = [];
        private connecting = false;
        private movingMode = false;
        private startNode = null;
        private endNode = null;

        function createNode(event) {
            nodeCount++;
            private node = document.createElement("div");
            node.classList.add("node");
            node.innerText = "Nodo " + nodeCount;
            node.style.left = `${event.clientX - 30}px`;
            node.style.top = `${event.clientY - 30}px`;
            node.onmousedown = (e) => selectNode(e, node);
            document.querySelector(".workspace").appendChild(node);
            nodes.push(node);
        }

        function selectNode(event, node) {
            event.stopPropagation();
            if (movingMode) {
                node.onmousemove = (e) => moveNode(e, node);
                node.onmouseup = () => node.onmousemove = null;
            } else if (connecting) {
                node.classList.add("selected");
                if (!startNode) {
                    startNode = node;
                } else if (startNode !== node) {
                    endNode = node;
                    openModal();
                }
            }
        }

        function moveNode(event, node) {
            node.style.left = `${event.clientX - 30}px`;
            node.style.top = `${event.clientY - 30}px`;
            updateConnections();
        }

        function toggleMoveMode() {
            movingMode = !movingMode;
            connecting = false;
            document.getElementById("status").innerText = movingMode ? "Modo Mover" : "Modo Normal";
        }

        function startConnection() {
            connecting = true;
            movingMode = false;
            document.getElementById("status").innerText = "Seleccione dos nodos";
        }

        function openModal() {
            document.getElementById("connectionModal").style.display = "block";
        }

        function closeModal() {
            document.getElementById("connectionModal").style.display = "none";
        }

        function confirmConnection(directed) {
            private weight = document.getElementById("weight").value;
            createConnection(startNode, endNode, directed, weight);
            closeModal();
            startNode.classList.remove("selected");
            endNode.classList.remove("selected");
            startNode = null;
            endNode = null;
            connecting = false;
            document.getElementById("status").innerText = "Modo Normal";
        }

        function createConnection(start, end, directed, weight) {
            private svg = document.getElementById("svgCanvas");
            private path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("stroke", "black");
            path.setAttribute("fill", "none");
            if (directed) {
                path.setAttribute("marker-end", "url(#arrowhead)");
            }

            private text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.textContent = weight;
            svg.appendChild(path);
            svg.appendChild(text);

            private isCurved = connections.some(conn => conn.start === end && conn.end === start);
            connections.push({ start, end, path, text, isCurved, weight });
            updateConnections();
        }

        function updateConnections() {
            connections.forEach(({ start, end, path, text, isCurved, weight }) => {
                private startX = start.offsetLeft + 30;
                private startY = start.offsetTop + 30;
                private endX = end.offsetLeft + 30;
                private endY = end.offsetTop + 30;

                private midX = (startX + endX) / 2 + (isCurved ? 40 : 0);
                private midY = (startY + endY) / 2 - (isCurved ? 40 : 0);

                path.setAttribute("d", `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`);
                text.setAttribute("x", midX);
                text.setAttribute("y", midY);
            });
        }
}
