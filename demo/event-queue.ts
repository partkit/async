/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { eventQueue, subscribe } from '../src/streams/index.js';

(() => {

    const rootId = 'event-queue';
    const rootElement = document.getElementById(rootId)!;
    const dispatchId = rootId + '-dispatch';
    const cancelId = rootId + '-cancel';
    const outputId = rootId + '-output';

    const template = document.createElement('template');
    template.innerHTML = `
    <style>
        #${ rootId } > p {
            display: flex;
            flex-flow: row nowrap;
        }
    </style>
    <p>
        <button id="${ dispatchId }">Dispatch Event</button>
        <button id="${ cancelId }">Cancel</button>
        <div id="${ outputId }"></div>
    </p>`;

    rootElement.appendChild(template.content);

    const dispatchElement = document.getElementById(dispatchId)!;
    const cancelElement = document.getElementById(cancelId)!;
    const outputElement = document.getElementById(outputId)!;

    const queue = eventQueue(dispatchElement, 'click');

    const { cancel, done } = subscribe(queue, event => {

        const time = new Date(event.timeStamp);
        const formatter = Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const output = document.createElement('div');
        output.innerHTML = `${ event.type }: ${ formatter.format(time) }`;

        outputElement.appendChild(output);

        setTimeout(() => outputElement.removeChild(output), 2000);
    });

    cancelElement.addEventListener('click', () => {

        cancel();
    });

    done.finally(() => {

        const output = document.createElement('div');
        output.innerHTML = 'done';

        outputElement.appendChild(output);
    });
})();
