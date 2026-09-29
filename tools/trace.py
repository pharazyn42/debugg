"""Records a step-by-step trace of Python snippets, for the daily puzzle's "Step through it".

Reads a JSON list of {"id", "code"} on stdin and writes {"<id>": [steps]} to stdout. Each step is
the moment before a line runs: {"line", "fn", "vars", "out"}; a function returning adds
{"ret": repr} to a step; the last step is {"end": true, "vars", "out"} with "error" if the code
raised. Values are shown with repr(), shortened past 70 characters. Run by tools/trace-puzzles.js.
"""
import io
import json
import sys
import types

MAX_STEPS = 150   # long loops are cut short (the last step is always the end)
MAX_REPR = 70


def show(v):
    if isinstance(v, types.FunctionType):
        return 'function ' + v.__name__ + '()'
    if isinstance(v, type):
        return 'class ' + v.__name__
    try:
        r = repr(v)
    except Exception:  # a broken __repr__ shouldn't stop the trace
        r = '<' + type(v).__name__ + '>'
    return r if len(r) <= MAX_REPR else r[:MAX_REPR - 1] + '…'


def snapshot(frame):
    out = {}
    for k, v in list(frame.f_locals.items()):
        if k.startswith('__') or isinstance(v, types.ModuleType):
            continue
        out[k] = show(v)
    return out


def trace(code):
    steps = []
    buf = io.StringIO()
    compiled = compile(code, '<puzzle>', 'exec')
    glob = {'__name__': '__main__'}
    cut = [False]

    def record(step):
        if len(steps) < MAX_STEPS:
            steps.append(step)
        else:
            cut[0] = True

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != '<puzzle>':
            return None
        name = frame.f_code.co_name
        if name.startswith('<') and name != '<module>':
            return None  # comprehensions and lambdas run inside the line that holds them
        fn = '' if name == '<module>' else name
        if event == 'line':
            record({'line': frame.f_lineno, 'fn': fn, 'vars': snapshot(frame), 'out': buf.getvalue()})
        elif event == 'return' and fn:
            record({'line': frame.f_lineno, 'fn': fn, 'vars': snapshot(frame), 'out': buf.getvalue(), 'ret': show(arg)})
        return tracer

    error = None
    old = sys.stdout
    sys.stdout = buf
    sys.settrace(tracer)
    try:
        exec(compiled, glob)
    except Exception as e:  # noqa: BLE001 - an uncaught error is part of the story
        error = type(e).__name__ + ': ' + str(e)
    finally:
        sys.settrace(None)
        sys.stdout = old
    end = {'end': True, 'vars': {k: show(v) for k, v in glob.items()
                                 if not k.startswith('__') and not isinstance(v, types.ModuleType)},
           'out': buf.getvalue()}
    if error:
        end['error'] = error
    if cut[0]:
        end['cut'] = True
    steps.append(end)
    return steps


def main():
    items = json.load(sys.stdin)
    result = {}
    for item in items:
        result[item['id']] = trace(item['code'])
    json.dump(result, sys.stdout, ensure_ascii=False, sort_keys=True)


if __name__ == '__main__':
    main()
