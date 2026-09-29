"""Answers questions about Python snippets for the puzzle checker (tools/check-puzzles.js).

Reads one JSON request on stdin and writes the answer as JSON:
  {"mode": "count", "code", "line"}   -> {"count": how many times that line ran}
  {"mode": "orders", "lines", "target"} -> {"orders": [every distinct order of the lines that prints
                                            exactly the target], "tried": n}
"""
import io
import itertools
import json
import sys

LINE_BUDGET = 20000  # stops an order that loops forever


class Budget(Exception):
    pass


def count(code, line):
    n = [0]

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != '<puzzle>':
            return None
        if event == 'line' and frame.f_lineno == line:
            n[0] += 1
        return tracer

    out = io.StringIO()
    old = sys.stdout
    sys.stdout = out
    sys.settrace(tracer)
    try:
        exec(compile(code, '<puzzle>', 'exec'), {'__name__': '__main__'})
    finally:
        sys.settrace(None)
        sys.stdout = old
    return n[0]


def output_of(code):
    steps = [0]

    def tracer(frame, event, arg):
        if event == 'line':
            steps[0] += 1
            if steps[0] > LINE_BUDGET:
                raise Budget()
        return tracer

    out = io.StringIO()
    old = sys.stdout
    sys.stdout = out
    sys.settrace(tracer)
    try:
        exec(compile(code, '<order>', 'exec'), {'__name__': '__main__'})
        return out.getvalue()
    except BaseException:  # noqa: BLE001 - a broken order just doesn't count
        return None
    finally:
        sys.settrace(None)
        sys.stdout = old


def orders(lines, target):
    found = []
    seen = set()
    tried = 0
    for perm in itertools.permutations(range(len(lines))):
        text = '\n'.join(lines[i] for i in perm)
        if text in seen:
            continue
        seen.add(text)
        tried += 1
        try:
            compile(text, '<order>', 'exec')
        except SyntaxError:
            continue
        out = output_of(text)
        if out is not None and out.rstrip() == target:
            found.append(list(perm))
    return {'orders': found, 'tried': tried}


def main():
    req = json.load(sys.stdin)
    if req['mode'] == 'count':
        result = {'count': count(req['code'], req['line'])}
    else:
        result = orders(req['lines'], req['target'])
    json.dump(result, sys.stdout)


if __name__ == '__main__':
    main()
