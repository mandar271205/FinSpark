import pickle

class CustomUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if module.startswith('numpy._core'):
            module = module.replace('numpy._core', 'numpy.core')
        return super().find_class(module, name)

with open('artifacts/finspark_models.pkl', 'rb') as f:
    models = CustomUnpickler(f).load()
print(f'[SUCCESS] {len(models)} models loaded successfully!')
with open('artifacts/finspark_scaler.pkl', 'rb') as f:
    scaler = CustomUnpickler(f).load()
print('[SUCCESS] Scaler loaded!')
with open('artifacts/finspark_metadata.pkl', 'rb') as f:
    meta = CustomUnpickler(f).load()
print(f'[SUCCESS] Metadata loaded | AUC: {meta["ensemble_auc"]:.4f} | Threshold: {meta["optimal_threshold"]:.4f}')
