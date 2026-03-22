import * as tf from '@tensorflow/tfjs';


async function load() {
    await tf.setBackend('cpu');
    await tf.ready();
}

load();

export class Net {
    model: tf.Sequential;

    constructor() {
        this.model = tf.sequential();

        this.model.add(tf.layers.dense({
            inputShape: [8],
            units: 64,
            activation: 'tanh',
            kernelInitializer: 'glorotUniform'
        }));

        this.model.add(tf.layers.dense({
            units: 32,
            activation: 'tanh',
            kernelInitializer: 'glorotUniform',
        }));

        this.model.add(tf.layers.dense({
            units: 2,
            activation: 'sigmoid',
            kernelInitializer: 'glorotUniform',
        }));

        this.model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'categoricalCrossentropy'
        });
    }

    async load(pth: string) {
        const response = await fetch(pth);
        const weights = await response.json();

  

        this.model.layers[0].setWeights([
            tf.tensor2d(weights['fc0.weight']).transpose(),
            tf.tensor1d(weights['fc0.bias']),
        ]);
        this.model.layers[1].setWeights([
            tf.tensor2d(weights['fc1.weight']).transpose(),
            tf.tensor1d(weights['fc1.bias']),
        ]);
        this.model.layers[2].setWeights([
            tf.tensor2d(weights['fc2.weight']).transpose(),
            tf.tensor1d(weights['fc2.bias']),
        ]);
    }

    compute(state: any, detailed: boolean) {
        const input = [
            ...state.opt,
            ...state.vel,
            ...state.acc,
            state.ang,
            state.ang_vel,
        ];
    
        const inputTensor = tf.tensor2d([input]);
        const out = this.model.predict(inputTensor) as tf.Tensor;
        
        if (!detailed) {
            const result = Array.from(out.dataSync());
            out.dispose(); // this is better, to clean up tensor data from memory, not sure why important ...
            inputTensor.dispose();
            return result;
        } else {
            const activations: number[][] = [];
            let inp = inputTensor as tf.Tensor;
    
            for (const layer of this.model.layers) {
                const next = layer.apply(inp, { training: false }) as tf.Tensor; // computing that layer

                activations.push(Array.from(next.dataSync())); // array.from converts to array //datasync blocks ui thrad to get synched data from tensors
                
                if (inp !== inputTensor) inp.dispose(); // not disposing input
                inp = next; // next input = previous layer output
            }
    
            out.dispose();
            inp.dispose();
            inputTensor.dispose();
            return activations;
        }
        

    } 

}