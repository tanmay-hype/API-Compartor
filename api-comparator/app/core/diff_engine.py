from typing import Any, List
from app.models.comparison_result import FieldDiff


def deep_diff(original: Any, migrated: Any, path: str = "") -> List[FieldDiff]:
    diffs: List[FieldDiff] = []

    if original == migrated:
        return diffs

    if original is None and migrated is not None:
        diffs.append(FieldDiff(field_path=path, original=original, migrated=migrated, diff_type="MISSING"))
        return diffs
    if migrated is None and original is not None:
        diffs.append(FieldDiff(field_path=path, original=original, migrated=migrated, diff_type="EXTRA"))
        return diffs

    if isinstance(original, dict) and isinstance(migrated, dict):
        keys = set(original.keys()) | set(migrated.keys())
        for k in keys:
            new_path = f"{path}.{k}" if path else k
            if k not in original:
                diffs.append(FieldDiff(field_path=new_path, original=None, migrated=migrated[k], diff_type="EXTRA"))
            elif k not in migrated:
                diffs.append(FieldDiff(field_path=new_path, original=original[k], migrated=None, diff_type="MISSING"))
            else:
                diffs.extend(deep_diff(original[k], migrated[k], new_path))
        return diffs

    if isinstance(original, list) and isinstance(migrated, list):
        # compare by index
        for i, (o, m) in enumerate(zip(original, migrated)):
            new_path = f"{path}[{i}]"
            diffs.extend(deep_diff(o, m, new_path))
        if len(original) < len(migrated):
            for i in range(len(original), len(migrated)):
                diffs.append(FieldDiff(field_path=f"{path}[{i}]", original=None, migrated=migrated[i], diff_type="EXTRA"))
        if len(original) > len(migrated):
            for i in range(len(migrated), len(original)):
                diffs.append(FieldDiff(field_path=f"{path}[{i}]", original=original[i], migrated=None, diff_type="MISSING"))
        return diffs

    # fallback: primitive mismatch
    diffs.append(FieldDiff(field_path=path, original=original, migrated=migrated, diff_type="TYPE_MISMATCH"))
    return diffs
