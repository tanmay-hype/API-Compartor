def normalise_path(p: str) -> str:
    if not p:
        return p
    return p.rstrip("/")
