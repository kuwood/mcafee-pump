function findSymbol(str) {
    const symbols = str.split(' ').filter(str => str.includes('(') && str.includes(')'));
    if (symbols.length === 1) {
        const symbolStr = symbols[0];
        const start = symbolStr.indexOf('(');
        const end = symbolStr.indexOf(')');
        const symbol = symbolStr.substring(start + 1, end);
        return symbol
    } else {
        return {error: 'Could not determine symbol'};
    }
}

module.exports = findSymbol;