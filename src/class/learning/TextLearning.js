import Bayes, { fromJson } from './bayes';

const { callApi } = require('../../util/common');

export const classes = [
    'ai_learning_classification',
    'ai_learning_text'
];

class TextNaiveBaye {
    #type = 'text';
    #url = '';
    #labels = [];
    #popup = null;
    #result = [];
    #loadModel;
    constructor({ url, labels, modelId, loadModel }) {
        this.#url = url;
        this.#labels = labels;
        this.#loadModel = loadModel;
        this.classifier = new Bayes({
            tokenizer: this.tokenizer,
        });
        this.load(url, modelId);
    }

    get labels() {
        return this.#labels;
    }

    unbanBlocks(blockMenu) {
        blockMenu.unbanClass(`ai_learning_classification`);
        blockMenu.unbanClass(`ai_learning_text`);
    }

    isAvailable() {
        if (!this.isLoaded) {
            throw new Error('ai learning text model load error');
        }
        return true;
    }

    getResult(index) {
        const result = this.#result.length ? this.#result : this.#popup?.result || [];
        const defaultResult = { probability: 0, className: '' };
        if (index !== undefined && index > -1) {
            return (
                result.find(({ className }) => className === this.#labels[index]) || defaultResult
            );
        }
        return result[0] || defaultResult;
    }

    openInputPopup() {
        const isAvailable = this.isAvailable();
        if (!isAvailable) {
            return;
        }
        this.#result = [];
        Entry.dispatchEvent('openMLInputPopup', {
            type: 'text',
            predict: async (text) => {
                this.#result = await this.predict(text);
            },
            url: this.#url,
            labels: this.#labels,
            setResult: (result) => {
                this.#result = result;
            },
        });
    }

    async tokenizer(text) {
        const params = { q: text };
        try {
            const { data } = await callApi(text, { url: '/learning/mecab', params });
            return data;
        } catch (e) {
            return text.split(/[^A-Za-zㄱ-힣0-9]+/);
        }
    }

    async predict(text) {
        this.#result = await this.classifier.categorize(text);
        return this.#result;
    }

    async load(url, modelId) {
        const data = await this.#loadModel({ url, modelId });
        if (!data) {
            return;
        }
        this.classifier = fromJson(JSON.stringify(data));
        this.classifier.tokenizer = this.tokenizer;
        this.isLoaded = true;
    }
}

export default TextNaiveBaye;
