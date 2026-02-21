import * as tf from '@tensorflow/tfjs';
await tf.setBackend('cpu');
await tf.ready();

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

    compute(state: any): number[] {
        const input = [
            ...state.opt,
            ...state.vel,
            ...state.acc,
            state.ang,
            state.ang_vel,
        ];
    
        const inputTensor = tf.tensor2d([input]);
        const out = this.model.predict(inputTensor) as tf.Tensor;
        return Array.from(out.dataSync());
    }
}